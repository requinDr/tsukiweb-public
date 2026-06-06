/**
 * Convert a script file into a folder of scenes in the format
 * used by the parser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'
import { parseScript } from '../../../../tsukiweb-common/tools/convert-scripts/parsers/nscriptr.ts';
import { Block, CommandToken, ConditionToken, LabelToken, ReturnToken, TextToken, Token } from '../../../../tsukiweb-common/tools/convert-scripts/parsers/utils.ts'
import { generateScenes, splitBlocks } from '../utils/nscriptr_convert.ts';
import { logger } from '../../../../tsukiweb-common/tools/utils/logger.ts';
import { updateGameJsonWithChoices } from '../utils/choices_extractor.ts';
import { isLogicLabel, processVarName } from './common.ts';
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
	f203 : "f48" , // identical scenes at beginning of far side
	f300 : "f301", // empty scene, removed
	f342 : "f341", // identical scenes, middle of Akiha route
	f503 : "f52" , // identical scenes at the end of Arc route.
	f538 : "f537", // identical osiete
	f542 : "f539", // identical osiete
	f358half: "f359" // useless intermediate label
}

function redirect(token: CommandToken) {
	for (const [i, arg] of token.args.entries()) {
		if (typeof arg == 'string' && arg.startsWith('*')) {
			let label = arg.substring(1)
			if (label in redirected_scenes) {
				label = redirected_scenes[label as keyof typeof redirected_scenes]
				if (!label)
					return false
				token.args[i] = `*${label}`
			}
		}
	}
}
function addChoiceCondition(token: Token, label: string, condition: string) {
	if (token instanceof CommandToken && token.cmd == 'select') {
		const i = token.args.indexOf(label)
		if (i < 0) throw Error(`Expected choice ${label}, got ${token.args}`)
		token.args[i] = `[${condition}]${label}`
		return true
	}
	return false
}

function logic_tokenFixes(token: Token): void|boolean|string {
	if (token instanceof ReturnToken) return false
	if (token instanceof TextToken) return false
	if (token instanceof LabelToken) return true
	if (token instanceof ConditionToken) {
		const condition = processCondition(token.condition, processVarName)
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
				token.args = token.args.map(x=>(x).trim())
				if (token.args.length == 4 &&
						token.args[1].match(/^\*f5\d{2}$/) &&
						token.args[3] == '*endofplay') {
					token.cmd = 'osiete'
					token.args = [token.args[1]]
				}
				return redirect(token)
			default:
				throw Error(`Unrecognized command ${token.toString()}`)
		}
	}
	throw Error(`Unrecognized token type of ${token}`)
}

function getBlockProps(label: string) {
	const tokenFixes = [logic_tokenFixes]
	const blockFixes: ((block: Block)=>void)[] = []
	if (isLogicLabel(label)) {
		switch (label) {
			case 'skip21' : // go to *f24 instead of passing through *f23
				tokenFixes.push((t)=> {
					if (t instanceof CommandToken && t.cmd == 'goto')
						t.args[0] = '*f24'
				})
				break
			case 'f36' : // two 'if' pointing to f37 and f201, but f37 redirected to f201
				tokenFixes.push((t)=> {
					if (t instanceof ConditionToken && t.condition.includes('his'))
						return false
				})
			case 'skip46' :
				// replaced *f47 with *f46 => remove if, condition *f46 choice on flg6 and near-side route completion
				tokenFixes.push((t)=> {
					if (t instanceof ConditionToken && (t.command as CommandToken).args[0] == '*f47a')
						return false
					else
						addChoiceCondition(t, '*f46b', "%flg6 && %cleared")
				})
				break
			case 'f46b' :
				tokenFixes.push((t)=> {
					// f203 redirected to identical f48, branch moved after f48
					if (t instanceof ConditionToken && (t.command as CommandToken).args[0] == '*f203')
						return false
					// simplify condition for s205
					if (t instanceof ConditionToken && (t.command as CommandToken).args[0] == "*f49")
						t.condition = "%regard_his>%regard_aki"
				})
				break
			case 'skip48' :
				blockFixes.push((block)=> {
					block.insert(1, "if %regard_koha>%regard_aki goto *f205")
				})
				break
			case 'skip84' :
				tokenFixes.push((t)=> { // invert and move condition to select
					if (t instanceof ConditionToken)
						return false
					addChoiceCondition(t, '*f87', "%flg3==0")
				})
				break
			case 'skip116a' : // if (...) goto *f117, choices imported
				tokenFixes.push((t)=> {
					if (t instanceof ConditionToken)
						return false 
				})
				break
			case 'skip199' : // s503 identical to s52 => branch moved after s52
				blockFixes.push((block)=> {
					block.replace(1, block.length-1, "goto *f52")
				})
				break
			case 'skip201' : // replaced *f37 with *f201 => condition *f202 choice on %clear_his
				tokenFixes.push((t)=> {
					addChoiceCondition(t, '*f202', "%clear_his")
				})
				break
			case 'skip261' : case 'skip262' : // last condition is redundant
				blockFixes.push((block)=> {
					const token = block.at(-1)
					if (token instanceof ConditionToken) {
						block.replace(-1, 1, token.command)
					}
				})
				break
			case 'skip40' : // add "inc %regard_aki" from bypassed f38
				blockFixes.push((block)=> {
					block.insert(1, 'inc %regard_aki')
				})
				break
			case 'skip43' : case 'skip44' : case 'skip45' :
				// remove redundant conditional branch to s46, as s47 is removed
				tokenFixes.push((t)=> {
					if (t instanceof ConditionToken)
						return false
				})
				break
			case 'skip57' : // f58 identical to f59 except an additional choice
				// if (...) { goto *f59 } else { goto *f58 } --> goto *f59
				// (goto *f59 replaced by content of skip59 later)
				blockFixes.push((block)=> {
					block.replace(1, block.length-1, 'goto *f59')
				})
				break
			case 'skip59' :
				// f58 replaced by identical f59, so add condition on the third choice
				tokenFixes.push((t)=> {
					addChoiceCondition(t, '*f64', "%regard_cel>=3")
				})
				break
			case 'skip299' : // move condition from if to select
				tokenFixes.push((t)=> {
					if (t instanceof ConditionToken)
						return false
					addChoiceCondition(t, '*f302', '%flgJ==0')
				})
				break
			case 'skip306': // invert and move condition from if to select
				tokenFixes.push((t)=> { // invert and move condition to select
					if (t instanceof ConditionToken)
						return false
					addChoiceCondition(t, '*f414', "%regard_koha<3")
				})
				break
			case "f338b" :
				tokenFixes.push((t)=> {
					if (t instanceof ConditionToken)
						return false
				})
				break
			case "skip358" :
				// move condition for s360 as a negative for f359, add condition to flgS
				tokenFixes.push((t)=> {
					if (t instanceof ConditionToken)
						return false
					addChoiceCondition(t, '*f359', "%flgO==0 || %flgS==0")
				})
				break
			case "skip361" :
				// condition on flgO is redundant with deadend after s358 if flgO == 1
				tokenFixes.push((t)=> {
					if (t instanceof ConditionToken)
						return false
				})
				break
			case 'skip381' : // move condition from if to select
				tokenFixes.push((t)=> {
					if (t instanceof ConditionToken)
						return false
					addChoiceCondition(t, '*f383', "%regard_aki>=9")
				})
				break
			case 'skip503' :
				// f503 deleted in favor of f52
				// add condition on the 2nd choice, skip52 later replaced by skip503
				tokenFixes.push((t)=> {
					addChoiceCondition(t, '*f53a', "%clear_ark")
				})
				break
			case 'f23' : case 'f24'    : // scenes merged into s21 and s22
			case 'f37' : case 'skip37' : // redirected to f201
			case 'f38' : // only "inc regard_aki", moved to skip40
			case 'f47' : case 'skip47' : // redirected to f46
			case 'f58' : case 'skip58' : // identical to f59, merged into f57
			case 'f59' : // merged into f57
			case 'f60' : case 'skip60' : // replaced by f62
			case 'f61' : case 'skip61' : // replaced by f63
			case 'f199_0' : // moved to skip199
			case 'f300' : case 'skip300' : // empty, redirected to f301
			case 'f342' : case 'skip342' :
			case 'f415' : case 'f53' : case 'skip53': // inaccessible scenes
			case 'f203' : case 'skip203': // redirected to f48
			case 'f503' : // redirected to f52
			case 'f538' : case 'skip538': // redirected to f537
			case 'f542' : case 'skip542': // redirected to f539
			case 'f358half' : // bypassed to f359
				return null
		}
		return { tokenFixes, blockFixes }
	} else {
		return null
	}
}

function interBlockFixes(blocks: Map<string, Block>) {

	// merge blocks
	const merged = {
		'skip21' : 'skip24', // day 1, merged scene is 3 lines to ask where to eat
		'skip22' : 'skip23', // day 1, idem
		'skip57' : 'skip59', // day 2, idem
		'skip52' : 'skip503', // end of arc route, identical scene, different choices
	}
	for (const [dest, src] of Object.entries(merged)) {
		const destBlock = blocks.get(dest)!
		const srcBlock = blocks.get(src)!
		srcBlock.delete(0) // remove label
		destBlock.delete(-1) // remove 'goto *f<X>'
		destBlock.extend(srcBlock)
		blocks.delete(src)
	}

	// test of f289 should be moved to f287 (according to mirrormoon)
	const skip287 = blocks.get('skip287')!
	const skip288 = blocks.get('skip288')!
	let token = skip288.at(1)
	if (token instanceof ConditionToken && (token.command as CommandToken).args[0] == '*f292') {
		skip287.insert(1, token, token.lineIndex);
		(token.command as CommandToken).args = ['*f288']; // if (...) goto *f288
		(skip287.at(2) as CommandToken).args = ['*f289'] // (else) goto *f289

		skip288.delete(1);
		(skip288.at(1) as CommandToken).args = ['*f292']
	}

	// move select from f411 to skip409
	blocks.get('skip409')!.replace(1, Infinity, blocks.get('f411')!.slice(1))
	blocks.delete('f411')
	blocks.get('skip409')!.forEach(t=>addChoiceCondition(t, '*f413', '%clear_his'))

	// add 'goto <next label>' if block ends without specifying next label
	for (const [index, [label, block]] of [...blocks.entries()].entries()) {
		const lastToken = block.at(-1)
		if (!(lastToken instanceof CommandToken) ||
			!(['goto', 'select', 'osiete'].includes(lastToken.cmd))){
			const nextLabel = [...blocks.keys()][index+1]
			block.insert(block.length, `goto *${nextLabel}`)
		}
	}

	//move choices from f117 to f116a, add conditions to added choices
	const skip116a = blocks.get('skip116a')
	const f117 = blocks.get('f117')
	token = skip116a!.find(t => t instanceof CommandToken && t.cmd == 'select')!;
	(token as CommandToken).args = (f117!.find(t => t instanceof CommandToken && t.cmd == 'select') as CommandToken).args;
	(token as CommandToken).args[(token as CommandToken).args.indexOf('*f121')] = '[%cleared]*f121';
	(token as CommandToken).args[(token as CommandToken).args.indexOf('*f122')] = '[%cleared]*f122'
	blocks.delete('f117')
}

function inc_hisui_skip323(text: string) {
	let i = text.indexOf("\n*skip323")
	if (i < 0)
		throw Error(`Cannot find marker "*skip323"`)
	let j = text.indexOf('\ngoto', i)+1
	if (text.substring(i, j).includes('%hisui_regard'))
		return text
	return text.substring(0, j) + 'inc %hisui_regard\n' + text.substring(j)
}

function raw_fixes(language: string, text: string) {
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

function extractDestinations(token: Token) {
	if (token instanceof ConditionToken)
		token = token.command
	if (!(token instanceof CommandToken))
		return []
	return token.args.map((a: string)=> {
		return a.match(destinationRegex)?.groups!.target ?? null
	}).filter(a=>a != null)
}

function genTree(blocks: Map<string, Block>) {
	//1. extract block children links
	const tree = new Map(Array.from(blocks.entries()).map(([label, block], i)=> {
		const children = block.tokens.flatMap(extractDestinations)
		const scene = children.find(lbl=>!isLogicLabel(lbl) && lbl != 'endofplay')
		const others = [...new Set(children.filter(lbl=>lbl != scene && lbl != 'endofplay')).values()]
		return [label, {scene, children: new Set(others), parents: new Set<string>(), index: -1}]
	}))
	//2. add link to parent
	for (const [label, {children}] of tree.entries()) {
		for (const child of children)
			tree.get(child)!.parents.add(label)
	}
	//3. move links before scenes to parent nodes, link to skip nodes
	for (const [label, {scene, children, parents}] of tree.entries()) {
		if (scene) {
			if (children.size > 0) {
				if (parents.size == 0)
					throw Error(`link before scene ${scene}, but no parent`)
				for (const parent of parents) {
					const parentNode = tree.get(parent)!
					for (const child of children)
						parentNode.children.add(child)
					// link from parent to scene is kept
				}
				for (const child of children) {
					const childNode = tree.get(child)!
					for (const parent of parents)
						childNode.parents.add(parent)
					childNode.parents.delete(label) // delete link from scene to child (might be restored in skip)
				}
				children.clear()
			}
			const skipLabel = `skip${scene.substring(1)}`
			const skipNode = tree.get(skipLabel)
			if (!skipNode)
				throw Error(`missing ${skipLabel} for scene ${scene}`)
			skipNode.parents.add(label)
			children.add(skipLabel)
		}
	}
	//4. bypass non-scene blocks
	for (const [label, {scene, parents, children}] of tree.entries()) {
		if (!scene) {
			for (const child of children) {
				const childNode = tree.get(child)!
				for (const parent of parents)
					childNode.parents.add(parent)
			}
			for (const parent of parents) {
				const parentNode = tree.get(parent)!
				for (const child of children)
					parentNode.children.add(child)
			}
			for (const parent of parents)
				tree.get(parent)!.children.delete(label)
			for (const child of children)
				tree.get(child)!.parents.delete(label)
		}
	}
	tree.set('openning', {scene: 'openning', children: new Set(['f20']), parents: new Set(), index: 0})
	tree.get('f20')!.parents.add('openning')

	//5. determine order index, easier for creating contexts when parsing scenes
	const queue = [tree.get('openning')]
	while (queue.length > 0) {
		const currentNode = queue.shift()!
		for (const child of currentNode.children) {
			const node = tree.get(child)!
			if (node.index >= 0) continue
			let index = -1
			for (const parent of node.parents) {
				const parentNode = tree.get(parent)!
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
		const pStr = Array.from(parents.values(), l=>tree.get(l)!.scene).sort().join(',')
		const cStr = Array.from(children.values(), l=>tree.get(l)!.scene).sort().join(',')
		return `${scene}:${pStr}|${cStr}`
	}).join('\n')
}

function extractChoices(blocks: Map<string, Block>) {
	return Object.fromEntries(Array.from(blocks.entries(), ([label, block])=> {
		const selects = block.filter(t => t instanceof CommandToken && t.cmd == 'select') as CommandToken[]
		if (selects.length == 0)
			return null
		if (selects.length > 1)
			throw Error(`multiple 'select' in label ${label}`)
		const [select] = selects
		const args = select.args

		// Labels may also contain disable or hide conditions
		const isText = (a: string)=> !['*', '(', '['].includes(a.charAt(0))

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
 * @returns blocks tree, choice texts, logic script
 */
function processSingleScript(folder: string, filename: string): [string, Record<string, string[]>, string] {
	const fullscriptPath = path.join(outputPathPrefix, folder, filename)

	if (!fs.existsSync(fullscriptPath)) {
		const errMsg = `Input file not found: ${fullscriptPath}`
		logger.error(errMsg)
		throw Error(errMsg)
	}

	const txt = fs.readFileSync(fullscriptPath, 'utf-8')
	const tokens = parseScript(raw_fixes(folder, txt))
	
	const blocks = splitBlocks(tokens, getBlockProps)
	interBlockFixes(blocks)
	const tree = genTree(blocks)
	const choices = extractChoices(blocks)
	const fileContents = generateScenes(blocks, ()=>LOGIC_FILE)

	return [tree, choices, fileContents.get(LOGIC_FILE)!]
}

export function main() {
	const totalScripts = fullscripts.length
	let logicScript = null
	let blocksTree = null

	let processedCount = 0
	for (const [folder, filename] of fullscripts) {
		processedCount++
		logger.progress(`Processing logic scripts: ${processedCount}/${totalScripts} (${filename})`)

		try {
			//1. Extract blocks tree, choice texts and logic script
			const [tree, choices, logicContent] = processSingleScript(folder, filename)

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
			logger.error(`Error processing ${filename}: ${(e as Error).message}`)
		}
	}
	logger.progress(`Processing logic scripts: ${processedCount}/${totalScripts}\n`)

	//4. Save logic script file and blocks tree
	if (GEN_LOGIC) {
		const centralLogicPath = path.join(outputPathPrefix, LOGIC_FILE + '.txt')
		const dir = path.dirname(centralLogicPath)
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}
		fs.writeFileSync(centralLogicPath, logicScript!)
	}
	if (GEN_TREE) {
		fs.writeFileSync(path.join('.', "logic_tree.txt"), blocksTree!)
	}
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
	main()
}
export { LOGIC_FILE }
