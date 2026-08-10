import { LabelName } from "../app/utils/types";
import { APP_VERSION } from "../app/utils/constants";
import { waitLanguageLoad } from "../translation/lang"
import { credits, scenesDir } from "translation/assets";
import { ASSETS_PATH } from "@tsukiweb/common/constants";
import { isScene } from "./utils";

async function fetchScene(sceneId: string): Promise<string[]> {
	await waitLanguageLoad()
	if (/^s\d+a?$/.test(sceneId))
		sceneId = `s${sceneId.substring(1).padStart(3, '0')}`;
	else if (sceneId == "ending") {
		return creditsScript(true)
	}

	const path = `${scenesDir()}/${sceneId}.txt?v=${APP_VERSION}`
	const response = await fetch(path).catch(() => null)
	if (!response?.ok)
		throw Error(`Cannot load file ${path}`)
	return (await response.text()).trim().split(/\r?\n/)
}

let cachedLogicScript: string | null = null

async function fetchLogicBlock(label: string) : Promise<string[]> {
	await waitLanguageLoad()

	const logicScript = cachedLogicScript ||= await fetch(
		`${ASSETS_PATH}logic.txt?v=${APP_VERSION}`
	).then(response => response.text())
	if (!logicScript)
		throw Error(`Failed to load logic file`)
	
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
		...credits().flatMap(([text, delay])=> [
			...(text ? [`bg ${text},crossfade,800`] : []),
			`delay ${delay}`,
		]),
		'bg #000000,crossfade,1500',
		...(insertEndOfPlay ? ["goto *endofplay"] : [])
	]
}
