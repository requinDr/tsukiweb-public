/**
 * Convert a script file into a folder of scenes in the format
 * used by the parser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'
import { parseScript } from '../../../tsukiweb-common/tools/convert-scripts/parsers/nscriptr.js';
import { CommandToken, ConditionToken, LabelToken, ReturnToken, TextToken, Token } from '../../../tsukiweb-common/tools/convert-scripts/parsers/utils.js'
import { generateScenes, splitBlocks } from '../utils/nscriptr_convert.js';
import { logError, logProgress } from '../../../tsukiweb-common/tools/utils/logging.js';
import { updateGameJsonWithChoices } from '../utils/choices_extractor.js';
import { isLogicLabel, processVarName, processCondition } from './common.js';

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
const LOGIC_FILE = "logic"
const GEN_CHOICES_JSON = true
const GEN_TREE 		   = true
const GEN_LOGIC 	   = true

//#endregion ###################################################################
//#region                             FIXES
//##############################################################################

const redirected_scenes = {
	f47  : "f46" , // identical scenes right before near/far-side split
	f37  : "f201", // identical scenes after school 1st day
	f38	 : "f40" , // f38 only used to increase regard_aki, moved after s40
	f300 : "f301", // empty scene, removed
}

function redirect(token) {
	for (const [i, arg] of token.args.entries()) {
		if (arg.startsWith('*')) {
			let label = arg.substring(1)
			if (Object.hasOwn(redirected_scenes, label)) {
				label = redirected_scenes[label]
				if (!label)
					return false
				token.args[i] = `*${label}`
			}
		}
	}
}

/**
 * @param {Token} token 
 * @returns {void|boolean|string}
 */
function logic_tokenFixes(token) {
	if (token instanceof ReturnToken) return false
	if (token instanceof TextToken) return false
	if (token instanceof LabelToken) return true
	if (token instanceof ConditionToken) {
		const condition = processCondition(token.condition)
		if (!condition)
			return false
		token.condition = condition
		return true
	}
	if (token instanceof CommandToken) {
		switch (token.cmd) {
			case 'br': case 'selgosub': case 'skip': case '!sd':
				return false// NOTE: 'selgosub' useful 7 times in KT, a solution must be found
			case 'mov': case 'add': case 'sub': case 'inc': case 'dec':
				let varName = processVarName(token.args[0])
				if (!varName) return false
				if (varName)
				token.args[0] = varName
				// route cleared determined with scene completion
				if (varName.match(/^%clear(ed|_\w+)$/))
					return false
				return true
			case 'gosub':
				if (token.args[0] == "*regard_update")
					return false
				
				if (/^\*s\d\w+$/.test(token.args[0])) {// gosub *sXXX
					token.cmd = 'goto'
					redirect(token)
				}
				return true
			case 'goto':
				return redirect(token);
			case 'select':
				token.args = token.args.map(x=>x.trim())
				if (token.args.length == 4 &&
						token.args[1].match(/^\*f5\d{2}$/) &&
						token.args[3] == '*endofplay') {
					token.cmd = 'osiete'
					token.args = [token.args[1]]
					return true
				} else {
					return redirect(token)
				}
			default:
				throw Error(`Unrecognized command ${token.toString()}`)
		}
	}
	throw Error(`Unrecognized token type of ${token}`)
}

/**
 * @param {string} label 
 */
function getBlockProps(label) {
	if (isLogicLabel(label)) {
		switch (label) {
			case 'skip21' : // go to *f24 instead of passing through *f23
				return {
					tokenFixes: [logic_tokenFixes, (t)=> {
						if (t instanceof CommandToken && t.cmd == 'goto')
							t.args[0] = '*f24'
					}]
				}
			case 'f23' : // if (...) goto *f24, moved to *skip21
				return {
					tokenFixes: [logic_tokenFixes, (t)=> {
						if (t instanceof ConditionToken)
							return false
					}]
				}
			case 'skip46' :
				// replaced *f47 with *f46 => remove if, condition *f46 choice on flg6 and near-side route completion
				return  {
					tokenFixes: [logic_tokenFixes, (t)=> {
						if (t instanceof ConditionToken && t.command.args[0] == '*f47a') {
							return false
						} else if (t instanceof CommandToken && t.cmd == 'select') {
							t.args[t.args.indexOf('*f46b')] = '[%flg6 && %cleared]*f46b'
						}
					}]
				}
			case 'skip116a' : // if (...) goto *f117, choices imported
				return {
					tokenFixes: [logic_tokenFixes, (t)=> {
						if (t instanceof ConditionToken)
							return false 
					}]
				}
			case 'skip201' : // replaced *f37 with *f201 => condition *f202 choice on %clear_his
				return {
					tokenFixes: [logic_tokenFixes, (t)=> {
						if (t instanceof CommandToken && t.cmd == 'select')
							t.args[t.args.indexOf('*f202')] = '[%clear_hisui]*f202'
					}]
				}
			case 'skip261' : case 'skip262' : // last condition is redundant
				return {
					tokenFixes: [logic_tokenFixes],
					blockFixes: [(tokens)=> {
						const token = tokens.at(-1)
						if (token instanceof ConditionToken) {
							tokens.splice(tokens.length-1, 1, token.command)
						}
					}]
				}
			case 'skip40' : // add "inc %regard_aki" from bypassed f38
				return {
					tokenFixes: [logic_tokenFixes],
					blockFixes: [(tokens)=> {
						tokens.splice(1, 0, ...parseScript('inc %regard_aki'))
					}]
				}
			case 'skip43' : case 'skip44' : case 'skip45' :
				// remove redundant conditional branch to s46, as s47 is removed
				return {
					tokenFixes: [logic_tokenFixes],
					blockFixes: [(tokens)=> {
						tokens.splice(tokens.findIndex(t=>t instanceof ConditionToken), 1)
					}]
				}
			case 'f47' : case 'skip47' : // redirected to f46
			case 'f37' : case 'skip37' : // redirected to f201
			case 'f38' : // only "inc regard_aki", moved to skip40
			case 'f300' : case 'skip300' : // empty, redirected to f301
			case 'f415' : case 'f53' : case 'skip53': // inaccessible scenes
				return null
		}
		return {
			tokenFixes: [logic_tokenFixes],
			//blockFixes: []
		}
	} else {
		return null
	}
}

function getFileProps(_label) {
	return {
		name: LOGIC_FILE
	}
}

/** @param {Map<string, Token[]>} blocks */
function interBlockFixes(blocks) {

	// test of f289 should be moved to f287 (according to mirrormoon)
	const skip287 = blocks.get('skip287')
	const skip288 = blocks.get('skip288')
	let token = skip288[1]
	if (token instanceof ConditionToken && token.command.args == '*f292') {
		skip287.splice(1, 0, token)
		token.index = skip287[1].index
		token.command.args = ['*f288'] // if (...) goto *f288
		skip287[2].args = ['*f289'] // (else) goto *f289

		skip288.splice(1, 1)
		skip288[1].args = ['*f292']
	}

	// add 'goto <next label>' if block ends without specifying next label
	for (const [index, [label, tokens]] of [...blocks.entries()].entries()) {
		const lastToken = tokens.at(-1)
		if (!(lastToken instanceof CommandToken) ||
			!(['goto', 'select', 'osiete'].includes(lastToken.cmd))){
			const nextLabel = [...blocks.keys()][index+1]
			tokens.push(...parseScript(`goto *${nextLabel}`))
		}
	}

	//move choices from f117 to f116a, add conditions to added choices
	const skip116a = blocks.get('skip116a')
	const f117 = blocks.get('f117')
	token = skip116a.find(t => t instanceof CommandToken && t.cmd == 'select')
	token.args = f117.find(t => t instanceof CommandToken && t.cmd == 'select').args
	token.args[token.args.indexOf('*f121')] = '[%cleared]*f121'
	token.args[token.args.indexOf('*f122')] = '[%cleared]*f122'
	blocks.delete('f117')
}

function inc_hisui_skip323(text) {
	let i = text.indexOf("\n*skip323")
	if (i < 0)
		throw Error(`Cannot find maker "*skip323"`)
	let j = text.indexOf('\ngoto', i)+1
	if (text.substring(i, j).includes('%hisui_regard'))
		return text
	return text.substring(0, j) + 'inc %hisui_regard\n' + text.substring(j)
}

/**
 * @param {string} language 
 * @param {string} text 
 */
function raw_fixes(language, text) {
	let i, j, k, next
	switch(language) {
		case 'ko-wolhui' :
			// korean translation replaced "goto *endofplay" in *skip510 with osiete f516
			i = text.indexOf('\n*skip510')
			if (i < 0)
				throw Error(`Cannot find maker "*skip510"`)
			i = text.indexOf('\n', i+1)+1
			j = text.indexOf('\n*', i)
			text = text.substring(0, i) + 'goto *endofplay' + text.substring(j)
			// forgot "inc %regard_his" in skip323
			text = inc_hisui_skip323(text)
			return text
		case 'zh-yueji_yeren_hanhua_zu' : case 'zh-tw-yueji_yeren_hanhua_zu' :
			// changed the order of logic blocs
			i = text.indexOf('\n*f502')
			j = text.indexOf('\n*f', i+10)
			k = text.indexOf('\n*f33')
			if (k < i)
				text = text.substring(0, k) + text.substring(i, j) + text.substring(k, i) + text.substring(j)
			i = text.indexOf('\n*f183')
			k = text.indexOf('\n*f51')
			if (k < i)
				text = text.substring(0, k) + text.substring(i) + text.substring(k, i) + '\n'
			text = inc_hisui_skip323(text)
			return text
		default : return text // no language-specific fix for logic
	}
}

//#endregion ###################################################################
//#region                       SIDE GENERATIONS
//##############################################################################

const destinationRegex = /^((\[[^\]]+\])|(\([^\]]+\)))?\*(?<target>\w+)$/ // [...]*X | (...)*X | *X

function extractDestinations(token) {
	if (token instanceof ConditionToken)
		token = token.command
	if (!(token instanceof CommandToken))
		return []
	return token.args.map(a=> {
		return a.match(destinationRegex)?.groups.target ?? null
	}).filter(a=>a != null)
}

/** @param {Map<string, Token[]>} blocks */
function genTree(blocks) {
	//1. extract block children links
	const tree = new Map(Array.from(blocks.entries()).map(([label, tokens], i)=> {
		const children = tokens.flatMap(extractDestinations)
		const scene = children.find(lbl=>!isLogicLabel(lbl) && lbl != 'endofplay')
		const others = [...new Set(children.filter(lbl=>lbl != scene && lbl != 'endofplay')).values()]
		return [label, {scene, children: new Set(others), parents: new Set(), index: -1}]
	}))
	//2. add link to parent
	for (const [label, {children}] of tree.entries()) {
		for (const child of children)
			tree.get(child).parents.add(label)
	}
	//3. move links before scenes to parent nodes, link to skip nodes
	for (const [label, {scene, children, parents}] of tree.entries()) {
		if (scene) {
			if (children.size > 0) {
				if (parents.size == 0)
					throw Error(`link before scene ${scene}, but no parent`)
				for (const parent of parents) {
					const parentNode = tree.get(parent)
					for (const child of children)
						parentNode.children.add(child)
					// link from parent to scene is kept
				}
				for (const child of children) {
					const childNode = tree.get(child)
					for (const parent of parents)
						childNode.parents.add(parent)
					childNode.parents.delete(label) // delete link from scene to child (might be restored in skip)
				}
				children.clear()
			}
			const skipLabel = `skip${scene.substring(1)}`
			const skipNode = tree.get(skipLabel)
			if (!skipNode)
				throw Error(`missing skip${skipLabel} for scene ${scene}`)
			skipNode.parents.add(label)
			children.add(skipLabel)
		}
	}
	//4. bypass non-scene blocks
	for (const [label, {scene, parents, children}] of tree.entries()) {
		if (!scene) {
			for (const child of children) {
				const childNode = tree.get(child)
				for (const parent of parents)
					childNode.parents.add(parent)
			}
			for (const parent of parents) {
				const parentNode = tree.get(parent)
				for (const child of children)
					parentNode.children.add(child)
			}
			for (const parent of parents)
				tree.get(parent).children.delete(label)
			for (const child of children)
				tree.get(child).parents.delete(label)
		}
	}
	tree.set('openning', {scene: 'openning', children: new Set(['f20']), parents: new Set(), index: 0})
	tree.get('f20').parents.add('openning')

	//5. determine order index, easier for creating contexts when parsing scenes
	const queue = [tree.get('openning')]
	while (queue.length > 0) {
		const currentNode = queue.shift()
		for (const child of currentNode.children) {
			const node = tree.get(child)
			if (node.index >= 0) continue
			let index = -1
			for (const parent of node.parents) {
				const parentNode = tree.get(parent)
				if (parentNode.index < 0) {
					index = -1
					break
				} else {
					index = Math.max(index, parentNode.index)
				}
			}
			if (index >= 0) {
				node.index = index+1
				queue.push(node)
			}
		}
	}
	//6. filter and sort labels
	const sceneNodes = Array.from(tree.values()).filter(({scene})=>scene != null)
		 .sort(({index: i1}, {index: i2})=>i1 - i2)

	return sceneNodes.map(({scene, parents, children, index})=> {
		if (index < 0) throw Error(`node of ${scene} was not assigned an index`)
		parents = Array.from(parents.values(), l=>tree.get(l).scene).sort().join(',')
		children = Array.from(children.values(), l=>tree.get(l).scene).sort().join(',')
		return `${scene}:${parents}|${children}`
	}).join('\n')
}

/** @param {Map<string, Token[]>} blocks */
function extractChoices(blocks) {
	return Object.fromEntries(Array.from(blocks.entries(), ([label, tokens])=> {
		const selects = tokens.filter(t => t instanceof CommandToken && t.cmd == 'select');
		if (selects.length == 0)
			return null
		if (selects.length > 1)
			throw Error(`multiple 'select' in label ${label}`)
		const [select] = selects
		const args = select.args

		// Labels may also contain disable or hide conditions
		const isText = (a)=> !['*', '(', '['].includes(a.charAt(0))

		const texts = args.filter(isText).map(txt => {
			const startChar = txt.charAt(0)
			if (startChar == '`')
				txt = txt.substring(1, txt.length-1)
			return txt
		})
		const labels = args.filter(a => !isText(a))
		select.args = labels
		return [label.replace('skip', 'f'), texts]
	}).filter(x=>x != null))
}


//#endregion ###################################################################
//#region                             MAIN
//##############################################################################

/**
 * @param {string} folder
 * @param {string} filename
 * @returns {[string, Record<string, string[]>, string]} blocks tree, choice texts, logic script
 */
function processSingleScript(folder, filename) {
	const fullscriptPath = path.join(outputPathPrefix, folder, filename)

	if (!fs.existsSync(fullscriptPath)) {
		logError(`Input file not found: ${fullscriptPath}`)
		return null
	}

	const txt = fs.readFileSync(fullscriptPath, 'utf-8')
	const tokens = parseScript(raw_fixes(folder, txt))
	
	const blocks = splitBlocks(tokens, getBlockProps)
	interBlockFixes(blocks)
	const tree = genTree(blocks)
	const choices = extractChoices(blocks)
	const fileContents = generateScenes(blocks, getFileProps)

	return [tree, choices, fileContents.get(LOGIC_FILE)]
}

export function main() {
	const totalScripts = fullscripts.length
	let logicScript = null
	let blocksTree = null

	let processedCount = 0
	for (const [folder, filename] of fullscripts) {
		processedCount++
		logProgress(`Processing Tsukihime scripts: ${processedCount}/${totalScripts} (${filename})`)

		try {
			//1. Extract blocks tree, choice texts and logic script
			const [tree, choices, logicContent] = processSingleScript(folder, filename, outputDir)

			//2. Compare blocks tree and logic script with previous languages
			if (blocksTree == null && logicScript == null)
				[blocksTree, logicScript] = [tree, logicContent]
			else if (logicScript != logicContent || blocksTree != tree)
				throw Error(`logic script from language ${folder} does not match previous languages`)

			//3. Update language game.json with choice texts
			if (GEN_CHOICES_JSON) {
				const gameJsonPath = path.join(outputPathPrefix, folder, 'game.json')
				updateGameJsonWithChoices(gameJsonPath, choices)
			}
		} catch (e) {
			logError(`Error processing ${filename}: ${e.message}`)
		}
	}
	logProgress(`Processing Tsukihime scripts: ${processedCount}/${totalScripts}\n`)

	//4. Save logic script file and blocks tree
	if (GEN_LOGIC) {
		const centralLogicPath = path.join(outputPathPrefix, LOGIC_FILE + '.txt')
		const dir = path.dirname(centralLogicPath)
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}
		fs.writeFileSync(centralLogicPath, logicScript)
	}
	if (GEN_TREE) {
		fs.writeFileSync(path.join('.', "tsukihime_logic_tree.txt"), blocksTree)
	}
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
	main()
}
export { LOGIC_FILE }