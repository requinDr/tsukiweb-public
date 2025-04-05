/**
 * Convert a script file into a folder of scenes in the format
 * used by the parser.
 */
import fs from 'fs';
import path from 'path';
import { parseScript } from './parsers/nscriptr.js';
import { CommandToken, ConditionToken, ErrorToken, LabelToken, ReturnToken, TextToken } from './parsers/utils.js'
import { generate } from './nscriptr_convert.js';
import { fixContexts, getScenes } from './scenes.js';


const LOGIC_FILE = "scene0"

//#endregion ###################################################################
//#region                        SPECIFIC FIXES
//##############################################################################

function tsukihime_logic_fixes(token, i, tokens) {
	if (!token) {
		return
	} else if (token instanceof TextToken) {
		tokens[i] = null // remove text tokens from logic file
	} else if (token instanceof CommandToken) {
		switch (token.cmd) {
			case 'br' : case 'selgosub' :
				tokens[i] = null
				break
			case 'skip':
				tokens[i] = null
				break
			case 'mov' :
				if (token.args[0].match(/%1\d{3}/) && +token.args[1] == 1)
					tokens[i] = null // ignore completion variables (%1000-%15XX)
				break
			case 'gosub' :
				if (token.args[0] == "*regard_update")
					tokens[i] = null
				break
			case 'select' :
				if (token.args.length == 4 &&
						token.args[1].trim().match(/^\*f5\d{2}$/) &&
						token.args[3].trim() == '*endofplay') {
					token.cmd = 'osiete'
					token.args = [token.args[1].trim()]
				}
				break
		}
	} else if (token instanceof ConditionToken) {
		if (token.condition.match(/%sceneskip\s*==\s*1/))
			tokens[i] = null // ignore skip prompt (handled by the UI)
	} else if (token instanceof ReturnToken) {
		tokens[i] = null
	}
}
const fixes = new Map(Object.entries({
	[LOGIC_FILE]: (tokens)=> tokens.forEach(tsukihime_logic_fixes),
	'openning': (tokens)=> {
		// center text lines except when they start with [line=X/] ("----")
		tokens.forEach(t=> {
			if ((t instanceof TextToken) && !t.text.trimStart().startsWith('[line='))
				t.text = '[center]' + t.text.trimStart()
		})
	},
	's46': (tokens)=> {
		let i = tokens.findIndex(t=> t instanceof CommandToken && t.cmd == 'bg')
		lines.splice(i+1, 0, 'waveloop se10')
	},
	's121': (tokens)=> {
		// if %flgE>=1 skip 5 --> ... skip 6, otherwise first skip lands on second one
		const i = tokens.findIndex(t=> t instanceof ConditionToken && t.condition.match(/%flgE\s*>=\s*1/))
		tokens[i].command.args = [6]
	},
	's228' : (tokens) => {
		const i = tokens.findLastIndex(t => t instanceof CommandToken && t.cmd == 'bg')
		lines.splice(i+1, 0, 'playstop')
	},
	's333' : (tokens) => {
		const i = tokens.findLastIndex(t => t instanceof CommandToken && t.cmd == 'bg')
		lines.splice(i+1, 0, 'playstop')
	},
	's140' : (tokens) => {
		let i = tokens.findLastIndex(t => t instanceof CommandToken && t.cmd == 'cl' && t.args[0] == 'c')
		i += tokens.slide(i).findIndex(t => t instanceof CommandToken && t.cmd == '\\')
		lines.splice(i+1, 0, 'playstop');
	},
	's178' : (tokens) => {
		tokens.unshift('play "*1"')
	},
}))

//#endregion ###################################################################
//#region                         GENERAL FIXES
//##############################################################################

const COLOR_IMAGES = new Map(Object.entries({
	'"bg/ima_10"' : '#000000',
	'"bg/ima_11"' : '#ffffff',
	'"bg/ima_11b"': '#9c0120',
}))

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
						tokens[i] = null
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
			return [{'bg' : img}, time > 0]
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
        case 'gosub' :
            return [{'bg': null, 'l': null, 'c': null, 'r': null}, true]
        case 'wait' : case '!w' : return [{}, true]
        case _ : return [{}, false]
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
	inserts = props.map(([key, value])=> {
		switch(key) {
			case 'bg' : return `bg ${value || '#000000'},notrans,0`
			case 'a' : case 'l' : case 'c' : case 'r' :
				return value ?
					`ld ${key},${value},notrans,0` :
					`cl ${key},notrans,0`
			case 'track' : return value ? `play ${value}` : `playstop`
			case 'waveloop' : return value ? `wavestop` : `waveloop ${value}`
			case 'monocro' : return `monocro ${value || 'off'}`
		}
	})
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
			return text
		default : return text
	}
}

function main() {
	// Process a single fullscript file
	// const inputFile = '../../public/static/jp/fullscript_jp.txt';
	// const outputDir = './output-jp';

	// const txt = fs.readFileSync(inputFile, 'utf-8')
	// const tokens = parseScript(txt);
	// generate(outputDir, tokens, getLabelFile, tsukihime_fixes)

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

			const outputPath = path.join(path_prefix, folder, outputDir)
			if (!fs.existsSync(outputPath)) {
				fs.mkdirSync(outputPath, { recursive: true })
			}

			generate(outputPath, tokens, getLabelFile, tsukihime_fixes)
		} catch (e) {
			console.error(`Error processing ${file}: ${e.message}`)
		}
	}
}

main()
export { LOGIC_FILE }