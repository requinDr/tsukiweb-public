import { PlusDiscSceneName, SceneName, TsukihimeSceneName } from "../types";
import { APP_VERSION, SCENE_ATTRS } from "./constants";
import { strings, waitLanguageLoad } from "../translation/lang"
import { credits, scenesDir } from "../translation/assets";
import { getGameVariable } from "./variables";

//##############################################################################
//#region                     FETCH SCENES / BLOCKS
//##############################################################################

const LOGIC_FILE = 'scene0.txt';

/*
 * Fetch and split the script into lines
 */
export function creditsScript(insertEndOfPlay: boolean = false): string[] {
	return [
		'play "*10"',
		'bg #000000,crossfade,400',
		...(credits().map(([text, delay])=> {
			const delayCmd = `delay ${delay}`
			if (!text)
				return delayCmd
			const textCmd = `bg ${text},crossfade,800`
			return [textCmd, delayCmd]
		}).flat()),
		'bg #000000,crossfade,1500',
		...(insertEndOfPlay ? ["goto *endofplay"] : [])
	]
}

export async function fetchScene(sceneId: string): Promise<string[] | undefined> {
	await waitLanguageLoad()
	if (/^s\d+a?$/.test(sceneId))
		sceneId = `scene${sceneId.substring(1)}`;
	else if (sceneId == "ending") {
		return await creditsScript(true)
	}
	const script = await fetch(`${scenesDir()}/${sceneId}.txt?v=${APP_VERSION}`).then(
		(response) => response.ok ? response.text() : undefined,
		(_failErr) => undefined);

	//split data on \n
	const result = script?.split(/\r?\n/).filter(line => line.length > 0);
	return result;
}

const ignoredFBlockLines = [
	"gosub *regard_update",
	"if %sceneskip"
];
const osieteRE = /[`"][^`"]+[`"],\s*(?<label>\*f5\d{2}),\s*[`"][^`"]+[`"],\s*\*endofplay/

async function fetchLogicBlock(label: string) : Promise<string[]> {
	await waitLanguageLoad()
	const logicScript = await fetch(`${scenesDir()}/${LOGIC_FILE}?v=${APP_VERSION}`).then(
		(response) => response.text());
	let start = logicScript.search(new RegExp(`^\\*${label}\\b`, "m"))
	if (start == -1)
		return [];
	start = logicScript.indexOf('\n', start+1)+1 // move to next line
	let end = logicScript.indexOf('\n*', start) // position of next label
	let lines
	if (end >= 0) {
		lines = logicScript.substring(start, end).split('\n')
		const nextLabel = logicScript.substring(end+1, logicScript.indexOf('\n', end+1))
		// if the script intends on continuing to next block, add goto at the end
		lines.push(`goto ${nextLabel}`)
	} else {
		lines = logicScript.substring(start).split('\n')
	}
	return lines.filter((line)=> {
		for (let ignored of ignoredFBlockLines) {
			if (line.startsWith(ignored))
				return false
		}
		return true
	})
}

export async function fetchFBlock(label: string): Promise<string[]> {
	const afterScene = /^skip\d+a?$/.test(label)

	const lines = (await fetchLogicBlock(label))

	// find 'gosub *sXXX'
	if (!afterScene) {
		let sceneLine = lines.findIndex(line => /^gosub\s+\*s\d/.test(line))
		if (sceneLine >= 0) {
			lines.splice(sceneLine + 1)
		}
	}
	let choiceIdx = lines.findIndex(line =>
		line.startsWith('select') || line.startsWith('osiete'))
	if (choiceIdx >= 0) {
		lines.splice(choiceIdx + 1)
	}
	return lines
}

//#endregion ###################################################################
//#region               SCRIPT PROCESSING HELPER FUNCTIONS
//##############################################################################

export function isThScene(label: string): label is TsukihimeSceneName {
	if (/^\*?s\d+a?$/.test(label))
		return true
	if (["openning", "ending", "eclipse"].includes(label))
		return true
	return false
}
export function isPDScene(label: string): label is PlusDiscSceneName {
	return ["pd_alliance", "pd_experiment", "pd_geccha", "pd_geccha2"].includes(label)
}
export function isScene(label: string): label is SceneName {
	return isThScene(label) || isPDScene(label)
}

export function getSceneTitle(label: TsukihimeSceneName): string|undefined {
	const attrs = strings.scenario.scenes[label] ?? SCENE_ATTRS.scenes[label]
	
	if (!attrs)
		return undefined
	if ("title" in attrs)
		return attrs.title
	else {
		const {r, d, s} = attrs
		let route: keyof typeof strings.scenario.routes
		if (typeof r == "object" && 'flg' in r)
			route = r[(getGameVariable(`%flg${r.flg}`)) ? "1" : "0"]
		else
			route = r

		let sceneName = strings.scenario.routes[route][d]
		if (s) {
			sceneName += " - "
			if (typeof s == "object" && 'flg' in s)
				sceneName += s[(getGameVariable(`%flg${s.flg}`)) ? "1" : "0"]
			else
				sceneName += s
		}
		return sceneName
	}
}

// (%var|n)(op)(%var|n)
const opRegexp = /(?<lhs>(%\w+|\d+))(?<op>[=!><]+)(?<rhs>(%\w+|\d+))/
const sepRegexp = /(?<=&&|\|\|)|(?=&&|\|\|)/
export function checkIfCondition(condition: string) {
	let value = true
	for (let [i, token] of condition.split(sepRegexp).entries()) {
		token = token.trim();
		if (i % 2 == 0) {
			const match = opRegexp.exec(token)
			if (!match) throw Error(
				`Unable to parse expression "${token}" in condition ${condition}`)

			let {lhs: _lhs, op, rhs: _rhs} = match.groups as any
			const lhs = _lhs.startsWith("%")? getGameVariable(_lhs) : parseInt(_lhs)
			const rhs = _rhs.startsWith("%")? getGameVariable(_rhs) : parseInt(_rhs)

			switch (op) {
				case '==' : value = (lhs == rhs); break
				case '!=' : value = (lhs != rhs); break
				case '<'  : value = (lhs <  rhs); break
				case '>'  : value = (lhs >  rhs); break
				case '<=' : value = (lhs <= rhs); break
				case '>=' : value = (lhs >= rhs); break
				default : throw Error (
					`unknown operator ${op} in condition ${condition}`)
			}
		} else {
			switch (token) {
				case "&&" : if (!value) return false; break
				case "||" : if (value) return true; break
				default : throw Error(
					`Unable to parse operator "${token}" in condition ${condition}`)
			}
		}
	}
	return value
}

function parseInlineCommand(text: string) {
	const argIndex = text.search(/\d|\s|$/)
	return {
		cmd: text.substring(0, argIndex),
		arg: text.substring(argIndex)
	}
}

function splitText(text: string) {
	const instructions = new Array<{ cmd:string, arg:string }>()
	let index = 0
	// replace spaces with en-spaces at the beginning of the line
	while (text.charCodeAt(index) == 0x20)
		index++
	text = "\u2002".repeat(index) + text.substring(index)
	// split tokens at every '@', '\', '!xxx'
	while (text.length > 0) {
		index = text.search(/@|!\w|$/)
		if (index > 0)
			instructions.push({cmd:'`', arg: text.substring(0, index)})
		text = text.substring(index)
		switch (text.charAt(0)) {
			case '@' :
				instructions.push({cmd: '@', arg:""})
				text = text.substring(1)
				break
			case '!' : // !w<time>
				const endIndex = text.substring(2).search(/\D|$/)+2
				const cmd = parseInlineCommand(text.substring(0, endIndex))
				instructions.push(cmd)
				text = text.substring(endIndex)
				break
		}
	}
	return instructions
}

export function extractInstructions(line: string) {
	const instructions = new Array<{cmd:string,arg:string}>()
	switch(line.charAt(0)) {
		case '!' : // inline command
			instructions.push(parseInlineCommand(line))
			break
		case '\\' : // page break
			instructions.push({cmd:'\\',arg:''})
			break
		case '`' : // text
			instructions.push(...splitText(line.substring(1)+'\n'))
			break
		default : // normal command
			let index = line.search(/\s|$/)
			instructions.push({
				cmd: line.substring(0,index),
				arg: line.substring(index+1)
			})
			break
	}
	return instructions
}
