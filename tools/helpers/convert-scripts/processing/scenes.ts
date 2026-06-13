/**
 * Convert a script file into a folder of scenes in the format
 * used by the parser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'
import { parseScript } from '../../../../tsukiweb-common/tools/convert-scripts/parsers/nscriptr.ts';
import { Block, CommandToken, ConditionToken, LabelToken, ReturnToken, TextToken, Token } from '../../../../tsukiweb-common/tools/convert-scripts/parsers/utils.ts'
import { generateScenes, splitBlocks, writeScenes } from '../utils/nscriptr_convert.ts';
import { logger } from '../../../../tsukiweb-common/tools/utils/logger.ts';
import { fixContexts } from '../utils/context.ts';
import { processVarName, isSceneLabel } from './common.ts';
import { processCondition } from '../../../../tsukiweb-common/tools/convert-scripts/utils.ts';

const outputPathPrefix = '../../../public/static/'
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
const parseTitleA = (val: string)=> val.match(routePhaseRE)?.groups ?? {}
const dayPhaseRE = /word\/day_(?<day>\d+)/
const rawScenePhaseRE = /word\/(?<scene>\w+)/
const parseTitleB = (val: string)=> val.match(dayPhaseRE)?.groups ??
	val.match(rawScenePhaseRE)?.groups ?? {}

function processPhase(token: CommandToken, i: number, block: Block) {
	token.cmd = 'phase'
	let side = token.args[0].charAt(1) // 'l' or 'r'
	if (!['l', 'r'].includes(side))
		throw Error(`cannot determine side of phase ${token}`)
	/** @type {Record<string, string>} */
	const args = Object.fromEntries(
		block.slice(i-3, i).map(t=> {
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
	} else {
		day = (+day).toString()
	}
	if (day.includes(','))
		throw Error(`Unexpected ',' in phase day`)
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
	block.delete(i-3, 3) // delete 
	// Ensure there is a page break between last text and phase
	for (let j = i-4; j >= 0; j--) {
		const t = block.at(j)
		if (t instanceof CommandToken) {
			if (['\\', 'phase'].includes(t.cmd))
				break
		} else if (t instanceof TextToken) {
			const text = t.text
			if (text.endsWith('\\'))
				break
			if (text.endsWith('@'))
				t.text = text.substring(0, text.length-1)
			//console.log(`adding '\\' before ${tokens[i]}, after ${tokens[j]}`)
			block.insert(j+1, new CommandToken(t.lineIndex, '\\'))
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

function commandFix(token: Token) {
	if (!(token instanceof CommandToken))
		return
	switch (token.cmd) {
		case 'bg' :
			if (COLOR_IMAGES.has(token.args[0]))
				token.args[0] = COLOR_IMAGES.get(token.args[0])!
			break
		case 'mov' :
			token.args[0] = processVarName(token.args[0])!
			if (!token.args[0])
				return false
			if (COLOR_IMAGES.has(token.args[1]))
				token.args[1] = COLOR_IMAGES.get(token.args[1])!
			break
		case 'wave' : case 'waveloop' :
			const m = token.args[0].match(/^"?se(?<n>\d+)"?$/)
			if (m) {
				// se0 -> se_01
				token.args[0] = `se_${String(+m.groups!.n + 1).padStart(2, '0')}`
			}
			break
	}
}

function merge_images(token: Token, bottom: string, top: string, replace: string) {
	if ((token instanceof CommandToken) && token.cmd == 'bg') {
		const img = token.args[0]
		if (img.includes(bottom)) {
			token.args[0] = img.replace(bottom, replace)
			token.args.push('bottom')
			return true
		} else if (img.includes(top)) {
			token.args[0] = img.replace(top, replace)
			token.args.push('top')
			return true
		}
	}
	return false
}

const tokenFixes = new Map(Object.entries({
	'openning': (token: Token)=> {
		if ((token instanceof TextToken) && !token.text.trimStart().startsWith('[line='))
			token.text = '[center]' + token.text.trimStart()
	},
	's425' : (token: Token)=> {
		merge_images(token, 'koha_h06a', 'koha_h06b', 'koha_h06')
	},
	's289a' : (token: Token)=> {
		merge_images(token, 'cel_e06a', 'cel_e06b', 'cel_e06')
	},
	's297' : (token: Token)=> {
		merge_images(token, 'cel_e06a', 'cel_e06b', 'cel_e06')
	},
}))

//_________________________________scene fixes__________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const blockFixes = new Map(Object.entries({
	's121': (block: Block)=> {
		// if %flgE>=1 skip 5 --> ... skip 7, otherwise first skip lands on second one
		const t = block.find(t=> t instanceof ConditionToken && /%flgE\s*>=\s*1/.test(t.condition));
		((t as ConditionToken).command as CommandToken).args = ['7']
	},
	's228' : (block: Block) => {
		const i = block.findLastIndex(t => t instanceof CommandToken && t.cmd == 'bg')
		block.insert(i+1, 'playstop')
	},
	's333' : (block: Block) => {
		const i = block.findLastIndex(t => t instanceof CommandToken && t.cmd == 'bg')
		block.insert(i+1, 'playstop')
	},
	's140' : (block: Block) => {
		let i = block.findLastIndex(t => t instanceof CommandToken && t.cmd == 'cl' && t.args[0] == 'c')
		i += block.slice(i).findIndex(t => t instanceof CommandToken && t.cmd == '\\')
		block.insert(i+1, 'playstop');
	},
	's178' : (block: Block) => {
		block.insert(0, 'play "*1"')
	},
	's532' : (block: Block) => {
		// insert delays between instant neko ark transitions
		for (const [t, i] of block) {
			if (t instanceof CommandToken && t.cmd == 'ld' && t.args[2] =='notrans') {
				const next = block.at(i+1)
				if (next instanceof CommandToken && next.cmd == 'ld' && next.args[2] == 'notrans')
					block.insert(i+1, "wait 100")
			}
		}
	},
	's535' : (block: Block) => {
		// insert delays between instant neko ark transitions
		for (const [t, i] of block) {
			if (t instanceof CommandToken && t.cmd == 'ld' && t.args[2] =='notrans') {
				const next = block.at(i+1)
				if (next instanceof CommandToken && next.cmd == 'ld' && next.args[2] == 'notrans')
					block.insert(i+1, "wait 100")
			}
		}
	}
}))

function sceneFixes(block: Block) {
	//remove '@' before '\\'
	for (const [token, i] of block) {
		if (token instanceof CommandToken && token.cmd == '\\') {
			const prev = block.at(i-1)
			if (prev instanceof TextToken && prev.text.endsWith('@'))
				prev.text = prev.text.substring(0, prev.text.length-1)
		}
	}
	// 1. Put '\' after last text of scenes (fix text skip before choices)
	// and selects outside logic file. Remove '@' if present and trailing 'br'.
	let stop = false
	for (let i = block.length-1; i>= 0 && !stop; i--) {
		const token = block.at(i)
		if (token instanceof CommandToken) {
			switch (token.cmd) {
				case 'br':
					block.delete(i) // remove line breaks after last text
					break
				case 'ld'  : case 'bg': case 'cl':
				case 'wait': case '!w':
					stop = true
					break
				case '\\' : case '@' :
					token.cmd = '\\' // convert '@' to '\\'
					stop = true
					break
				case 'select' :
					// console.log(`removing 'select' command line in ${file}`)
					block.delete(i) // no 'select' in scenes
					break
			}
			if (stop)
				break
		} else if (token instanceof TextToken) {
			if (token.text.endsWith('@'))
				token.text = token.text.substring(0, token.text.length-1)
			block.insert(i+1, new CommandToken(token.lineIndex, '\\'))
			break
		}

	}
	// 2. Reformat phase transitions
	for (const [token, i] of block) {
		if ( (token instanceof CommandToken) && (token.cmd == 'gosub') &&
			 (/^\*(left|right)_phase$/.test(token.args[0])) ) {
			processPhase(token as CommandToken, i, block)
		}
	}
}

function eroskip_fixes(pages: ([number, number]|[number]|number)[], block: Block) {
	const pageIndices = [-1] // -1 to insert eroskip at the start if necessary
	for (const [token, i] of block) {
		if (token instanceof CommandToken && token.cmd == '\\')
			pageIndices.push(i)
	}
	for (const entry of pages.reverse()) {
		let start, end;
		if (typeof entry == 'number') {
			start = entry
			end = pageIndices.length
		} else if (entry.length == 1) {
			start = entry[0]
			end = pageIndices.length
		} else {
			[start, end] = entry
		}
		block.insert(pageIndices[start]+1, `eroskip ${+end - start}`);
	}
}

function interScenesFixes(blocks: Map<string, Block>) {
	// Merge s21 <- s24, s22 <- s23, s57 <- s59 (3 lines just to ask where to eat, days 1 and 2)
	blocks.get('s21')!.extend(blocks.get('s24')!)
	blocks.get('s22')!.extend(blocks.get('s23')!)
	blocks.get('s57')!.extend(blocks.get('s59')!)
	blocks.delete('s23')
	blocks.delete('s24')
	blocks.delete('s59')

	// replace s46 with content from s47
	blocks.set('s46', blocks.get('s47')!)
	blocks.delete('s47')
	blocks.get('s46')!.name = 's46'
}


//#endregion ###################################################################
//#region                            CONTEXT
//##############################################################################

const PROP_CMDS = ['monocro', 'bg', 'a', 'l', 'c', 'r', 'track', 'waveloop']

function cmdToProps(cmd: string, args: string[]): [object, boolean] {
	switch (cmd) {
		case 'bg' : {
			const [img, , time] = args
			return [{'bg': img, 'l': null, 'c': null, 'r': null}, +time > 0]
		}
		case 'ld' : {
			const [pos, img, , time] = args
			return [{[pos]: img}, +time > 0]
		}
		case 'cl' : {
			const [pos, , time] = args
			if (pos == 'a')
				return [{'l': null, 'c': null, 'r': null}, +time > 0]
			else
				return [{[pos]: null}, +time > 0]
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

function propsToCmds(props: Map<string, any>) {
	const spritePos = ['l', 'c', 'r']
	// If at least one sprite position is specified, but all of them are null:
	if (spritePos.some(p=>props.has(p))
		&& !(spritePos.some(p=> props.get(p) != null))) {
		props = new Map(props) // clone props to avoid side-effects of modifying parameter
		// remove all sprites ...
		props.delete('l')
		props.delete('c')
		props.delete('r')
		if (!props.has('bg')) // ... and specify empty position 'a' if no bg
			props.set('a', null)
	}
	const propsArray = [...props.entries()].sort(([k1,],[k2,])=>{
		return PROP_CMDS.indexOf(k1) - PROP_CMDS.indexOf(k2)
	})
	const insertCmds = propsArray.map(([key, value])=> {
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
	
	return insertCmds.filter(cmd=>cmd) as string[]
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
const deleted_scenes = [
	// Empty scenes
	's16' , 's17' , 's18' , 's19', 's32', 's38', 's50', 's117', 's272',
	's300', 's309', 's311', 's411',
	// Inaccessible scenes
	's53', 's415',
	// Content replaced by s47
	's46',
	// Identical to s201
	's37',
	// Identical to 59, 62 and 63.
	's58', 's60', 's61',
	// identical to s48
	's203',
	// identical to s341
	's342',
	// Identical to s52
	's503',
	// identical to s537 and s539
	's538', 's542'
]

function token_filter(token: Token) {
	if (token == null) return false
	if (token instanceof ReturnToken) return false
	if (token instanceof TextToken  ) return true
	if (token instanceof LabelToken) return false
	if (token instanceof ConditionToken) {
		token.condition = processCondition(token.condition, processVarName)!
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

function getBlockProps(
		lang_block_fixes: Map<string, (block: Block)=>void>,
		eroskip_pages: Map<string, ([number, number]|[number]|number)[]>,
		label: string) {
	if (!isSceneLabel(label)) {
		return null // logic blocks handled in separate script
	}
	if (deleted_scenes.includes(label)) {
		return null
	}
	const token_fixes = [ token_filter, commandFix ] as Array<(t: Token)=>void|boolean>
	const block_fixes = [ sceneFixes ] as Array<(block: Block)=>void>
	if (tokenFixes.has(label))
		token_fixes.push(tokenFixes.get(label)!)
	if (blockFixes.has(label))
		block_fixes.push(blockFixes.get(label)!)
	if (lang_block_fixes.has(label))
		block_fixes.push(lang_block_fixes.get(label)!)
	if (eroskip_pages.has(label))
		block_fixes.push(eroskip_fixes.bind(undefined, eroskip_pages.get(label)!))
	
	return {
		tokenFixes: token_fixes,
		blockFixes: block_fixes
	}
}
function getFileName(label: string) {
	if (['eclipse', 'openning'].includes(label))
		return label
	if (/^s\d\w+?$/.test(label))
		return `s${label.substring(1).padStart(3, '0')}`
	
	throw Error(`Unexpected label ${label}`)
}


async function processSingleScript(folder: string, filename: string,
		outputDir: string|null,
		blocksTree: Map<string, {parents: string[], children: string[], endContext: object|null}>) {
	const fullscriptPath = path.join(outputPathPrefix, folder, filename)

	if (!fs.existsSync(fullscriptPath)) {
		logger.error(`Input file not found: ${fullscriptPath}`)
		return null
	}

	let txt = fs.readFileSync(fullscriptPath, 'utf-8')
	let eroskip_pages = {}
	let block_fixes = {}
	let preprocess_module_path = path.join(process.cwd(), outputPathPrefix, folder, 'preprocess.js')
	if (fs.existsSync(preprocess_module_path)) {
		preprocess_module_path = path.relative(import.meta.dirname, preprocess_module_path)
		const lang_module = await import(preprocess_module_path.replaceAll('\\', '/'))
		if ('th_raw_fixes' in lang_module)
			txt = lang_module.th_raw_fixes(txt) || txt
		if ('eroskip_pages' in lang_module)
			eroskip_pages = lang_module.eroskip_pages
		if ('block_fixes' in lang_module)
			block_fixes = lang_module.block_fixes
	}
	const tokens = parseScript(txt)
	
	const blocks = splitBlocks(tokens, getBlockProps.bind(undefined,
		new Map(Object.entries(block_fixes)),
		new Map(Object.entries(eroskip_pages))
	))
	interScenesFixes(blocks)
	fixContexts(blocksTree, blocks, cmdToProps, propsToCmds)
	const fileContents = generateScenes(blocks, getFileName)

	const outputPath = outputDir
		? path.join(outputPathPrefix, folder, outputDir)
		: null

	if (outputPath) {
		const scenesList = new Map(fileContents)
		writeScenes(outputPath, scenesList)
	}
}


export async function main() {

	//1. Retrieve scenes tree
	const treeFilePath = path.join('.', "logic_tree.txt")
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
		return [ match[1] as string, {
			parents: match[2].split(',').filter(x=>x) as string[],
			children: match[3].split(',').filter(x=>x) as string[],
			endContext: null as null|object}
		] as const
	}).filter(x=>x != null))

	//2. Extract scenes, fix start contexts
	const totalScripts = fullscripts.length
	let processedCount = 0
	for (const [folder, filename] of fullscripts) {
		processedCount++
		logger.progress(`Processing fullscripts: ${processedCount}/${totalScripts} (${filename})`)
		try {
			await processSingleScript(folder, filename, outputDir, tree)
		} catch (e) {
			logger.error(`Error processing ${filename}: ${(e as Error).message}`)
		}
	}
	logger.progress(`Processing fullscripts: ${processedCount}/${totalScripts}\n`)
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
	main()
}
