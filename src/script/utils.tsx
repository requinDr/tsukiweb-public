import { LabelName, PlusDiscSceneName, RouteName, SceneName, TsukihimeSceneName } from "../types";
import { APP_VERSION, SCENE_ATTRS } from "../utils/constants";
import { strings } from "../translation/lang"
import { ScriptPlayer } from "./ScriptPlayer";
import { credits, scenesDir } from "translation/assets";
import { waitLanguageLoad } from "translation/langSelection";

export type SkipRequest =
    (label: LabelName, script: ScriptPlayer)=>Promise<boolean>

//#endregion ###################################################################
//#region                          LABEL INFO
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

export function getSceneTitles(label: TsukihimeSceneName): { flg: string, titles: [string, string] } | string | undefined {
	const attrs = strings.scenario.scenes[label] ?? SCENE_ATTRS.scenes[label]
	if (!attrs)
		return undefined
	if ("title" in attrs)
		return attrs.title
	else {
		const {r, d, s} = attrs
		let flg = null
		let routes: RouteName[]
		if (typeof r == "object" && 'flg' in r)
			routes = [r['0'], r['1']], flg = r.flg
		else
			routes = [r]

		let scenes: string[]|undefined
		if (typeof s == "object" && 'flg' in s) {
			if (!flg)
				routes = [routes[0], routes[0]], flg = s.flg
			else if (flg != s.flg)
				throw Error(`Unexpected multiple flags for label ${label}`)
			scenes = [s['0'], s['1']]
		} else if (s && flg) {
			scenes = [s, s]
		} else if (s) {
			scenes = [s]
		} else {
			scenes = undefined
		}
		const titles = routes.map((r, i) => {
			const dayName = strings.scenario.routes[r][d]
			if (scenes)
				return `${dayName} - ${scenes[i]}`
			else return dayName
		})
		if (flg)
			return {flg, titles: titles as [string, string]}
		return titles[0]
	}
}

export function getSceneTitle(flags: string[], label: TsukihimeSceneName): string|undefined {
	const attrs = strings.scenario.scenes[label] ?? SCENE_ATTRS.scenes[label]
	const titles = getSceneTitles(label)
	if (typeof titles != 'object')
		return titles
	else if (flags.includes(titles.flg))
		return titles.titles[1]
	else return titles.titles[0]
}

export function nextLabel(label: LabelName): LabelName {
	if (/^s\d+a?$/.test(label))
		return `skip${label.substring(1)}` as LabelName
	else if (label == "openning")
		return 's20'
	else
		return 'endofplay'
}

//#endregion ###################################################################
//#region                         FETCH BLOCKS
//##############################################################################

const LOGIC_FILE = 'logic.txt'

export async function fetchScene(sceneId: string): Promise<string[]> {
	await waitLanguageLoad()
	if (/^s\d+a?$/.test(sceneId))
		sceneId = `s${sceneId.substring(1).padStart(3, '0')}`;
	else if (sceneId == "ending") {
		return creditsScript(true)
	}

	const path = `${scenesDir()}/${sceneId}.txt?v=${APP_VERSION}`
	const script = await fetch(path).then(
		(response) => response.ok ? response.text() : undefined,
		(_failErr) => undefined)
	
	if (script == undefined)
		throw Error(`Cannot load file ${path}`)
	//split data on \n
	return script?.trim().split(/\r?\n/);
}

let cachedLogicScript: string | null = null

export async function fetchLogicBlock(label: string) : Promise<string[]> {
	await waitLanguageLoad()

	if (!cachedLogicScript) {
		const ASSETS_PATH = `${import.meta.env.BASE_URL}static/`
		const path = `${ASSETS_PATH}${LOGIC_FILE}?v=${APP_VERSION}`
		cachedLogicScript = await fetch(path)
			.then(response => response.text())
	}
	
	if (!cachedLogicScript) {
		throw Error(`Failed to load logic file`)
	}
	
	const logicScript = cachedLogicScript
	
	let start = logicScript.search(new RegExp(`^\\*${label}\\b`, "m"))
	if (start == -1)
		return []
	start = logicScript.indexOf('\n', start+1)+1 // move to next line
	let end = logicScript.indexOf('\n*', start) // position of next label
	let nextLabel, lines
	if (end >= 0) {
		nextLabel = logicScript.substring(end+1, logicScript.indexOf('\n', end+1))
	} else {
		nextLabel = '*endofplay'
		end = logicScript.length
	}
	lines = logicScript.substring(start, end).split(/\r?\n/)
	// add goto at the end in case the script intends on continuing to next block
	const lastLine = lines.at(-1) as string
	if (!(lastLine.startsWith('select') || lastLine.startsWith('goto')))
		lines.push(`goto ${nextLabel}`)
	return lines
}

export async function fetchBlockLines(label: LabelName): Promise<string[]> {
	if (isScene(label))
		return fetchScene(label)
	else
		return fetchLogicBlock(label)
}

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

export function isLinePageBreak(line: string, index: number,
		sceneLines: string[], playing: boolean = false): boolean {
	if (playing) {
		return line.startsWith('\\') || line.startsWith('phase ')
	} else {
		if (line.startsWith('\\'))
			return true
		else if (line.startsWith('phase'))
			// prevents counting 2 pages for conditional phases
			return !sceneLines[index+1].startsWith('skip')
		else
			return false
	}
}


export function getPageAtLine(lines: string[], index: number) {
	let p = 0
	for (let i = 0; i < index; i++) {
		const line = lines[i]
		if (isLinePageBreak(line, i, lines))
			p++
	}
	return p
}