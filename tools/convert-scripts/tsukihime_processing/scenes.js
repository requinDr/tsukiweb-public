/**
 * Convert a script file into a folder of scenes in the format
 * used by the parser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'
import { parseScript } from '../../../tsukiweb-common/tools/convert-scripts/parsers/nscriptr.js';
import { CommandToken, ConditionToken, LabelToken, ReturnToken, TextToken, Token } from '../../../tsukiweb-common/tools/convert-scripts/parsers/utils.js'
import { generateScenes, splitBlocks, writeScenes } from '../utils/nscriptr_convert.js';
import { logError, logProgress } from '../../../tsukiweb-common/tools/utils/logging.js';
import { fixContexts } from '../utils/context.js';
import { isLogicLabel, processVarName, processCondition, isSceneLabel } from './common.js';

const outputPathPrefix = '../../public/static/'
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

//#endregion ###################################################################
//#region                             FIXES
//##############################################################################

//____________________________________phase_____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
	// check if there is a page break between last text and phase
	for (let j = i-4; j >= 0; j--) {
		if (tokens[j] instanceof TextToken) {
			const text = tokens[j].text
			if (text.endsWith('\\')) {
				break
			}
			if (text.endsWith('@')) {
				tokens[j].text = text.substring(0, text.length-1)
			}
			//console.log(`adding '\\' before ${tokens[i]}, after ${tokens[j]}`)
			// Insert page break.
			// Index is conserved by moving tokens on step, using one null
			// token before phase as a room to move tokens to
			tokens.splice(j+1, (i - (j+1)),
				new CommandToken(tokens[j].lineIndex, '\\'),
				...tokens.slice(j+1, i-1))
			break
		} else if (tokens[j] instanceof CommandToken && tokens[j].cmd == '\\') {
			break
		}
	}
}

//_________________________________token fixes__________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const COLOR_IMAGES = new Map(Object.entries({
	'"bg/ima_10"' : '#000000',
	'"bg/ima_11"' : '#ffffff',
	'"bg/ima_11b"': '#9c0120',
}))

function commandFix(token) {
	if (!(token instanceof CommandToken))
		return
	switch (token.cmd) {
		case 'bg' :
			if (COLOR_IMAGES.has(token.args[0]))
				token.args[0] = COLOR_IMAGES.get(token.args[0])
			break
		case 'mov' :
			token.args[0] = processVarName(token.args[0])
			if (!token.args[0])
				return false
			if (COLOR_IMAGES.has(token.args[1]))
				token.args[1] = COLOR_IMAGES.get(token.args[1])
			break
		case 'gosub' :
			if (/^\*s\d\w+$/.test(token.args[0]))
				token.cmd = 'goto'
			break
		case 'wave' : case 'waveloop' :
			const m = token.args[0].match(/^"?se(?<n>\d+)"?$/)
			if (m) {
				// se0 -> se_01
				token.args[0] = `se_${String(+m.groups.n + 1).padStart(2, '0')}`
			}
			break
	}
}

const tokenFixes = new Map(Object.entries({
	'openning': (token)=> {
		if ((token instanceof TextToken) && !token.text.trimStart().startsWith('[line='))
			token.text = '[center]' + token.text.trimStart()
	},
}))

//_________________________________scene fixes__________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const blockFixes = new Map(Object.entries({
	's121': (tokens)=> {
		// if %flgE>=1 skip 5 --> ... skip 7, otherwise first skip lands on second one
		const i = tokens.findIndex(t=> t instanceof ConditionToken && t.condition.match(/%flgE\s*>=\s*1/))
		tokens[i].command.args = [7]
	},
	's228' : (tokens) => {
		const i = tokens.findLastIndex(t => t instanceof CommandToken && t.cmd == 'bg')
		tokens.splice(i+1, 0, 'playstop')
	},
	's333' : (tokens) => {
		const i = tokens.findLastIndex(t => t instanceof CommandToken && t.cmd == 'bg')
		tokens.splice(i+1, 0, 'playstop')
	},
	's140' : (tokens) => {
		let i = tokens.findLastIndex(t => t instanceof CommandToken && t.cmd == 'cl' && t.args[0] == 'c')
		i += tokens.slice(i).findIndex(t => t instanceof CommandToken && t.cmd == '\\')
		tokens.splice(i+1, 0, 'playstop');
	},
	's178' : (tokens) => {
		tokens.unshift('play "*1"')
	},
	's404': (tokens) => {
		tokens.findLastIndex(t => t instanceof CommandToken && t.cmd)
	}
}))

/**
 * @param {Token[]} tokens 
 */
function sceneFixes(tokens) {
	// 1. Put '\' after last text of scenes (fix text skip before choices)
	// and selects outside logic file. Remove '@' if present and trailing 'br'.
	let stop = false
	for (let i = tokens.length-1; i>= 0 && !stop; i--) {
		const token = tokens[i]
		if (token instanceof CommandToken) {
			switch (token.cmd) {
				case 'br':
					tokens[i] = null; // remove line breaks after last text
					break
				case 'ld': case 'bg': case 'cl':
					stop = true;
					break
				case 'wait': case '!w':
					stop = true;
					break
				case '\\' : case '@' :
					token.cmd = '\\' // convert '@' to '\\'
					stop = true
					break
				case 'select' :
					// console.log(`removing 'select' command line in ${file}`)
					tokens[i] = null // no 'select' in scenes
					break
			}
		} else if (token instanceof TextToken) {
			if (token.text.endsWith('@'))
				token.text = token.text.substring(0, token.text.length-1)
			tokens.splice(i+1, 0, new CommandToken(token.lineIndex, '\\'))
			stop = true
		}
	}
	// 2. Reformat phase transitions
	let index = 0
	while ((index = tokens.findIndex((t=>{
		if (!(t instanceof CommandToken)) return false
		if (t.cmd != 'gosub') return false
		if (!/^\*(left|right)_phase$/.test(t.args[0])) return false
		return true
	}))) >= 0) {
		processPhase(tokens[index], index, tokens)
		tokens = tokens.slice(index+1)
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
			return [{'bg': img, 'l': null, 'c': null, 'r': null}, time > 0]
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
		// ... and at least one position is specified...
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
	'gosub', // used for phase transitions
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
	'resettimer',
	'goto', 'osiete', 'return', 'select', 'selgosub', //logic-only commands
	
]

function token_filter(token) {
	if (token == null) return false
	if (token instanceof ReturnToken) return false
	if (token instanceof TextToken  ) return true
	if (token instanceof LabelToken) return false
	if (token instanceof ConditionToken) {
		token.condition = processCondition(token.condition)
		if (!token.condition) return false
		return true
	}
	if (token instanceof CommandToken) {
		if (   kept_commands.includes(token.cmd)) return true
		if (ignored_commands.includes(token.cmd)) return false
		throw Error(`unrecognized command ${token.cmd} (line ${token.lineIndex})`)
	}
	throw Error(`Unrecognized token type of ${token}`)
}

/**
 * @param {string} label 
 */
function getBlockProps(label) {
	if (!isSceneLabel(label)) {
		return null // logic blocks handled in separate script
	}
	switch(label) {
		case 's16' : case 's17' : case 's18' : case 's19' : case 's32' :
		case 's38' : case 's50' : case 's272': case 's300': case 's309':
		case 's311': case 's411': // empty scenes
			return null
		case 's117':
			return null
		case 's46' : // content replaced by content of s47
			return null
		case 's37' : // identical to s201
			return null
		case 'f415': // inaccessible scene
			return null
		case 'f43' : // inaccessible scene
			return null
		default :
			return {
				tokenFixes: [ token_filter, commandFix,
					tokenFixes.get(label) ].filter(x => x != undefined),
				blockFixes: [ sceneFixes,
					blockFixes.get(label) ].filter(x => x != undefined)
			}
	}
}
function getFileProps(label) {
	if (['eclipse', 'openning'].includes(label))
		return { name: label }
	if (label == 's47')
		label = 's46' // use content from s47 for s46, the last page is better
	if (/^s\d\w+?$/.test(label))
		return { name: `s${label.substring(1).padStart(3, '0')}` }
	
	throw Error(`Unexpected label ${label}`)
}

/**
 * @param {Map<string, Token[]>} files
 */
function tsukihime_fixes(files) {
	for (const [file, tokens] of files.entries()) {
		tokens.splice(0, tokens.length, ...tokens.filter(token_filter.bind(null, file)))
		const fix = fixes.get(file)
		if (fix)
			fix(tokens, file, files)
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


/**
 * @param {string} folder
 * @param {string} filename
 * @param {string|null} outputDir
 * @returns {string|null} Logic file content
 */
function processSingleScript(folder, filename, outputDir, blocksTree) {
	const fullscriptPath = path.join(outputPathPrefix, folder, filename)

	if (!fs.existsSync(fullscriptPath)) {
		logError(`Input file not found: ${fullscriptPath}`)
		return null
	}

	const txt = fs.readFileSync(fullscriptPath, 'utf-8')
	const tokens = parseScript(raw_fixes(folder, txt))
	
	const blocks = splitBlocks(tokens, getBlockProps)
	blocks.set('s46', blocks.get('s47'))
	fixContexts(blocksTree, blocks, cmdToProps, propsToCmds)
	const fileContents = generateScenes(blocks, getFileProps)

	const outputPath = outputDir
		? path.join(outputPathPrefix, folder, outputDir)
		: null

	if (outputPath) {
		const scenesList = new Map(fileContents)
		writeScenes(outputPath, scenesList)
	}
}


export function main() {

	//1. Retrieve scenes tree
	const treeFilePath = path.join('.', "tsukihime_logic_tree.txt")
	if (!fs.existsSync(treeFilePath))
		throw Error(`Missing tree file. Extract logic first`)
	const treeFileContent = fs.readFileSync(treeFilePath, 'utf-8')
	const tree = new Map(treeFileContent.split('\n').map(line=> {
		line = line.trim()
		if (line.length == 0)
			return null
		const match = line.trim().match(/^(\w+):([^|]*)\|(.*)$/)
		if (!match)
			throw Error(`unable to parse line ${line} from tree file`)
		return [ match[1], {
			parents: match[2].split(',').filter(x=>x),
			children: match[3].split(',').filter(x=>x),
			endContext: null }
		]
	}).filter(x=>x != null))

	//2. Extract scenes, fix start contexts
	const totalScripts = fullscripts.length
	let processedCount = 0
	for (const [folder, filename] of fullscripts) {
		processedCount++
		logProgress(`Processing Tsukihime scripts: ${processedCount}/${totalScripts} (${filename})`)
		try {
			processSingleScript(folder, filename, outputDir, tree)
		} catch (e) {
			logError(`Error processing ${filename}: ${e.message}`)
		}
	}
	logProgress(`Processing Tsukihime scripts: ${processedCount}/${totalScripts}\n`)
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
	main()
}