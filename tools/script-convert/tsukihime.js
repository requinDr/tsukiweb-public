/**
 * Convert a script file into a folder of scenes in the format
 * used by the parser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'
import { parseScript } from './parsers/nscriptr.js';
import { CommandToken, ConditionToken, ErrorToken, LabelToken, ReturnToken, TextToken, Token } from './parsers/utils.js'
import { generate } from './nscriptr_convert.js';
import { fixContexts, getScenes } from './scenes.js';

const LOGIC_FILE = "scene0"

const CONDITION_REGEXP = /^(?<lhs>(%\w+|\d+))(?<op>[=!><]+)(?<rhs>(%\w+|\d+))$/

//#endregion ###################################################################
//#region                        SPECIFIC FIXES
//##############################################################################

function processVarName(varName) {
	if (varName == "%sceneskip")
		return null
	if (varName.match(/^%1\d{3}$/)) // scene completion
		return null
	if (varName == "%ark_normalcleared")
		return "%clear_ark_true"
	if (varName.endsWith('_regard')) {
		let char = varName.split('_')[0]
		switch(char) {
			case '%ark'   : return '%regard_ark'
			case '%ciel'  : return '%regard_cel'
			case '%akiha' : return '%regard_aki'
			case '%hisui' : return '%regard_his'
			case '%kohaku': return '%regard_koha'
			default : throw Error(`regard variable ${varName} not recognized`)
		}
	}
	return varName
}

function processCondition(condition) {
	condition = condition.trim()
	/** @type {string[]} */
	let subConditions = condition.split('&&')
	if (subConditions.length > 1)
		return subConditions.map(processCondition).filter(c => c).join(' && ')
	let match = CONDITION_REGEXP.exec(condition)
	if (!match) throw Error(
		`Unable to parse condition "${condition}"`)

	let {lhs, op, rhs} = match.groups
	if (lhs.startsWith('%'))
		lhs = processVarName(lhs)
	if (rhs.startsWith('%'))
		rhs = processVarName(rhs)
	if (!lhs || !rhs)
		return null
	return `${lhs}${op}${rhs}`
}

function tsukihime_logic_fixes(labels, token, i, tokens) {
	if (!token) {
		return
	} else if (token instanceof TextToken) {
		tokens[i] = null // remove text tokens from logic file
	} else if (token instanceof CommandToken) {
		switch (token.cmd) {
			case 'br'		: tokens[i] = null; break
			case 'selgosub' : tokens[i] = null; break
			case 'skip'		: tokens[i] = null; break
			case 'mov' : case 'add' : case 'sub' :
			case 'inc' : case 'dec' :
				let [varName] = token.args
				varName = processVarName(token.args[0])
				if (!varName)
					tokens[i] = null
				else {
					token.args[0] = varName
					// route cleared determined with scene completion
					if (varName.match(/^%clear(ed|_\w+)$/))
						tokens[i] = null
				}
				break
			case 'gosub' :
				if (token.args[0] == "*regard_update")
					tokens[i] = null
				break
			case 'goto' :
				if (token.args[0] == "*f300")
					token.args[0] = "*f301"
				break
			case 'select' :
				if (token.args.length == 4 &&
						token.args[1].trim().match(/^\*f5\d{2}$/) &&
						token.args[3].trim() == '*endofplay') {
					token.cmd = 'osiete'
					token.args = [token.args[1].trim()]
				} else {
					const targetLabels = token.args.filter((a, i)=>i%2==1 && a.startsWith('*f'))
					for(let lbl of targetLabels) {
						if (!labels.includes(lbl.substring(1)))
							throw Error(`target label ${lbl} does not exist`)
					}
				}
				break
		}
	} else if (token instanceof ConditionToken) {
		let condition = processCondition(token.condition)
		if (condition == null)
			tokens[i] = null
		else {
			tokens[i].condition = condition
			const conditionalTokens = [token.command]
			tsukihime_logic_fixes(labels, token.command, 0, conditionalTokens)
			if (conditionalTokens[0] == null)
				tokens[i] = null
			else {
				token.command = conditionalTokens[0]
			}
		}
	} else if (token instanceof ReturnToken) {
		tokens[i] = null
	}
}
const fixes = new Map(Object.entries({
	[LOGIC_FILE]: (tokens)=> {
		const labels = tokens.filter(t=>t instanceof LabelToken).map(t=>t.label)
		tokens.forEach(tsukihime_logic_fixes.bind(null, labels))
	},
	'openning': (tokens)=> {
		// center text lines except when they start with [line=X/] ("----")
		tokens.forEach(t=> {
			if ((t instanceof TextToken) && !t.text.trimStart().startsWith('[line='))
				t.text = '[center]' + t.text.trimStart()
		})
	},
	'scene46': (tokens)=> {
		let i = tokens.findIndex(t=> t instanceof CommandToken && t.cmd == 'bg')
		tokens.splice(i+1, 0, 'waveloop se_11')
	},
	'scene121': (tokens)=> {
		// if %flgE>=1 skip 5 --> ... skip 6, otherwise first skip lands on second one
		const i = tokens.findIndex(t=> t instanceof ConditionToken && t.condition.match(/%flgE\s*>=\s*1/))
		tokens[i].command.args = [7]
	},
	'scene228' : (tokens) => {
		const i = tokens.findLastIndex(t => t instanceof CommandToken && t.cmd == 'bg')
		tokens.splice(i+1, 0, 'playstop')
	},
	'scene333' : (tokens) => {
		const i = tokens.findLastIndex(t => t instanceof CommandToken && t.cmd == 'bg')
		tokens.splice(i+1, 0, 'playstop')
	},
	'scene140' : (tokens) => {
		let i = tokens.findLastIndex(t => t instanceof CommandToken && t.cmd == 'cl' && t.args[0] == 'c')
		i += tokens.slice(i).findIndex(t => t instanceof CommandToken && t.cmd == '\\')
		tokens.splice(i+1, 0, 'playstop');
	},
	'scene178' : (tokens) => {
		tokens.unshift('play "*1"')
	},
	'scene404': (tokens) => {
		tokens.findLastIndex(t => t instanceof CommandToken && t.cmd)
	}
}))

//#endregion ###################################################################
//#region                         GENERAL FIXES
//##############################################################################

const COLOR_IMAGES = new Map(Object.entries({
	'"bg/ima_10"' : '#000000',
	'"bg/ima_11"' : '#ffffff',
	'"bg/ima_11b"': '#9c0120',
}))

const routePhaseRE = /word\/p(?<route>[a-z]+)_(?<rDay>\d+[ab])/
const parseTitleA = (val)=> val.match(routePhaseRE)?.groups ?? {}
const dayPhaseRE = /word\/day_(?<day>\d+)/
const rawScenePhaseRE = /word\/(?<scene>\w+)/
const parseTitleB = (val)=> val.match(dayPhaseRE)?.groups ??
                                    val.match(rawScenePhaseRE)?.groups ?? {}

/**
 * @param {CommandToken} token 
 * @param {number} i 
 * @param {Token[]} tokens 
 */
function processPhase(token, i, tokens) {
	token.cmd = 'phase'
	let side = token.args[0].charAt(1) // 'l' or 'r'
	if (!['l', 'r'].includes(side))
		throw Error(`cannot determine side of phase ${token}`)
	/** @type {Record<string, string>} */
	const args = Object.fromEntries(
		tokens.slice(i-3, i).map(t=> {
			if (!(t instanceof CommandToken && t.cmd == 'mov'))
				throw Error(`Expected 3 'mov' before ${token}`)
			return t.args
		})
	)
	let {'$phasebg': bg, '$phasetitle_a': titleA,
		 '$phasetitle_b': titleB} = args
	titleA = titleA.toLowerCase()
	titleB = titleB.toLowerCase()
	let {day = '', scene = ''} = parseTitleB(titleB)
	if (!day) {
		if (!scene)
			day = '0'
		else
			day = scene
	}
	if (day.includes(','))
		throw Error(`Unexpected ',' in phase day`)
	if (!Number.isNaN(+day))
		day = +day
	if (titleA.startsWith('#'))
		token.args = [bg,side,"others",day,0]
	else {
		let {route = "", rDay = ""} = parseTitleA(titleA)
		if (!route || !rDay)
			throw Error(`Cannot parse ${titleA}`)

		if (route.includes(',') || rDay.includes(','))
			throw Error(`Unexpected ',' in phase route and route day`)
		token.args = [bg,side,route,rDay,day]
	}
	tokens[i-3] = tokens[i-2] = tokens[i-1] = null
}

/**
 * @param {string} file 
 * @param {Token[]} tokens 
 */
function generalFixes(file, tokens) {
	for (const [i, token] of tokens.entries()) {
		if (token instanceof CommandToken) {
			switch (token.cmd) {
				case 'bg' :
					if (COLOR_IMAGES.has(token.args[0]))
						token.args[0] = COLOR_IMAGES.get(token.args[0])
					break
				case 'mov' :
					if (COLOR_IMAGES.has(token.args[1]))
						token.args[1] = COLOR_IMAGES.get(token.args[1])
					else if (token.args[0] == '%rockending')
						tokens[i] = null // unused in game
					break
				case 'gosub' :
					if (/^\*(left|right)_phase$/.test(token.args[0])) {
						processPhase(token, i, tokens)
					}
					else if (/^\*s\d\w+$/.test(token.args[0])) {
						token.cmd = 'goto'
					}
					break
				case 'wave' : case 'waveloop' :
					const m = token.args[0].match(/^"?se(?<n>\d+)"?$/)
					if (m) {
						token.args[0] = `se_${parseInt(m.groups['n'])+1}`
					}
					break
			}
		} else if (token instanceof ReturnToken) {
			if (file != LOGIC_FILE) {
				tokens[i] = null
			}
		}
	}
}

//#endregion ###################################################################
//#region                            CONTEXT
//##############################################################################
const PROP_CMDS = ['monocro', 'bg', 'a', 'l', 'c', 'r', 'track', 'waveloop']

/**
 * @param {string} cmd 
 * @param {any[]} args 
 */
function cmdToProps(cmd, args) {
	switch (cmd) {
		case 'bg' : {
			const [img, , time] = args
			return [{'bg' : img, 'l': null, 'c': null, 'r': null}, time > 0]
		}
		case 'ld' : {
			const [pos, img, , time] = args
			return [{[pos]: img}, time > 0]
		}
		case 'cl' : {
			const [pos, , time] = args
			if (pos == 'a')
				return [{'l': null, 'c': null, 'r': null}, time > 0]
			else
				return [{[pos]: null}]
		}
        case 'play': return [{'track': args[0]}, false]
        case 'playstop' : return [{'track': null}, false]
        case 'waveloop' : return [{'waveloop': args[0]}, false]
        case 'wavestop' : case 'wave' : return [{'waveloop': null}, false]
        case 'monocro' :
			return [{'monocro': (args[0]=='off')? null : args[0]}, false]
        case 'phase' :
            return [{'bg': null, 'l': null, 'c': null, 'r': null,
					 'track': null, 'waveloop': null, 'monocro': null}, true]
        case 'wait' : case '!w' : return [{}, true]
        default : return [{}, false]
	}
}

/**
 * @param {Map<string, any>} props 
 */
function propsToCmds(props) {
	// if all sprite positions are empty...
	if (!(['l', 'c', 'r'].some(pos=> props.get(pos) != null))) {
		// ... and at least one position is spcified...
		if (['l', 'c', 'r'].reduce((x, pos) => x || props.delete(pos), false))
			// ... then replace all positions with a single 'a'
        	props.set('a', null)
	}
	props = [...props.entries()].sort(([k1,],[k2,])=>{
		return PROP_CMDS.indexOf(k1) - PROP_CMDS.indexOf(k2)
	})
	const insertCmds = props.map(([key, value])=> {
		switch(key) {
			case 'bg' : return `bg ${value || '#000000'},notrans,0`
			case 'a' : case 'l' : case 'c' : case 'r' :
				return value ?
					`ld ${key},${value},notrans,0` :
					`cl ${key},notrans,0`
			case 'track' : return value ? `play ${value}` : `playstop`
			case 'waveloop' : return value ? `waveloop ${value}` : `wavestop`
			case 'monocro' : return `monocro ${value || 'off'}`
		}
	})
	const insertText = insertCmds.join('\n')
	const inserts = parseScript(insertText, 0)
	
	return inserts
}
//#endregion ###################################################################
//#region                            MAIN
//##############################################################################

const kept_commands = [
    'play', 'playstop', 'wave', 'waveloop', 'wavestop', 'mp3loop', 'stop', // audio
    'bg', 'ld', 'cl','quakex', 'quakey', 'monocro', // graphics
    'if', 'skip', 'jumpf', 'jumpb', '~', // in-scene movements
    'osiete', 'return', 'goto', 'gosub', 'select', 'selgosub',// inter-scenes movements
    '@', '\\', 'click', 'br', 'textcolor', // text commands, wait click
    '!w', 'wait', 'waittimer', 'delay', // delay
    'mov', 'add', 'sub', 'inc', 'dec', // set variables
]
// TODO: selgosub commands should be removed. They are only useful in KT
// in some contexts (7 occurrences), for which a solution must be found

const ignored_commands = [
    'setwindow', 'windoweffect',
    'setcursor', 'autoclick',
    '!s', '!sd',
    'resettimer'
]

function token_filter(file, token) {
	if (token == null)
		return false
    if (token instanceof TextToken)
        return true
    if (token instanceof ConditionToken)
        return token_filter(file, token.command) // keep if command after 'if' is kept
    if (token instanceof ErrorToken)
        return false
    if (token instanceof ReturnToken)
        return true
    if (token instanceof CommandToken) {
        if (kept_commands.includes(token.cmd))
            return true
        if (ignored_commands.includes(token.cmd))
            return false
        throw Error(`unrecognized command ${token.cmd} (line ${token.lineIndex})`)
	}
	if (token instanceof LabelToken) {
		return file == LOGIC_FILE
	}
	throw Error(`Unrecognized token type of ${token}`)
}

/** @param {string} label */
function getLabelFile(label) {
    if (["eclipse", "openning"].includes(label))
        return label
	if (['f300', 'skip300', 's300'].includes(label))
		return null // remove empty f300 scene
    if (/^s\d\w+?$/.test(label))
        return `scene${label.substring(1)}`
    if (/^se\d\w+?$/.test(label)) //TODO move to kt-specific script
        return `scene${label.substring(1)}`
    if (/^f\d\w+?$/.test(label))
        return LOGIC_FILE
    if (/^skip\d\w+?$/.test(label))
        return LOGIC_FILE
    if (/^quizz\d\w+?$/.test(label)) //TODO move to kt-specific script
        return `quizz`
    return null
}

/**
 * @param {Map<string, Token[]>} files
 */
function tsukihime_fixes(files) {
	for (const [file, tokens] of files.entries()) {
		tokens.splice(0, tokens.length, ...tokens.filter(token_filter.bind(null, file)))
		const fix = fixes.get(file)
		if (fix)
			fix(tokens)
		let lineIndex = 0
		for (let i=0; i < tokens.length; i++) {
			if (!tokens[i])
				continue
			if (!(tokens[i] instanceof Token)) {
				tokens.splice(i, 1, ...parseScript(tokens[i], lineIndex))
			} else {
				lineIndex = tokens[i].lineIndex
			}
		}
		generalFixes(file, tokens)
	}
	const scenes = getScenes(files, LOGIC_FILE, (label)=> {
		if (/^s\d\w+/.test(label))
			return `scene${label.substring(1)}`
		if (label == 'openning')
			return label
		return null
	}, new Map([['openning', {
		label: 'openning', scene: 'openning', children: ['f20']}
	]]))
	fixContexts(scenes, cmdToProps, propsToCmds)
}

/**
 * @param {string} language 
 * @param {string} text 
 */
function raw_fixes(language, text) {
	switch(language) {
		case 'it-riffour' :
			text = text.replaceAll(/ò(?=[a-fA-F\d]{6})/g, '#')
			let searchText = `\` Ha HAHAHA HAHAHAHAHAHA\\`
			let i = text.indexOf(searchText)
			if (i < 0)
				throw Error(`cannot find anchor of s404 to add missing playstop`)
			i += searchText.length
			text = text.substring(0, i) + '\nplaystop\n' + text.substring(i)
			return text
		default : return text
	}
}

export function main() {
	// Process all fullscript files
	const path_prefix = '../../public/static/'
	const outputDir = 'scenes'
	const fullscripts = [
		['jp', 'fullscript_jp.txt'],
		['en-mm', 'fullscript_en-mm.txt'],
		['es-tohnokun', 'fullscript_es-tohnokun.txt'],
		['it-riffour', 'fullscript_it-riffour.txt'],
		['pt-matsuri', 'fullscript_pt-matsuri.txt'],
		['ko-wolhui', 'fullscript_ko-wolhui.txt'],
		['ru-ciel', 'fullscript_ru-ciel.txt'],
		['zh-tw-yueji_yeren_hanhua_zu', 'fullscript_zh-tw-yueji_yeren_hanhua_zu.txt'],
		['zh-yueji_yeren_hanhua_zu', 'fullscript_zh-yueji_yeren_hanhua_zu.txt'],
	]

	for (const [folder, file] of fullscripts) {
		try {
			console.log(`> Processing ${file}...`)
			
			const fullscriptPath = path.join(path_prefix, folder, file)
			if (!fs.existsSync(fullscriptPath)) {
				console.error(`File not found: ${fullscriptPath}`)
				continue
			}

			const txt = fs.readFileSync(fullscriptPath, 'utf-8')
			const tokens = parseScript(raw_fixes(folder, txt))
			let outputPath
			if (outputDir) {
				outputPath = path.join(path_prefix, folder, outputDir)
				if (!fs.existsSync(outputPath)) {
					fs.mkdirSync(outputPath, { recursive: true })
				}
			} else {
				outputPath = null
			}
			generate(outputPath, tokens, getLabelFile, tsukihime_fixes)
		} catch (e) {
			console.error(`Error processing ${file}: ${e.message}`)
		}
	}
	console.log(`> Done.`)
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
	main()
}
export { LOGIC_FILE }