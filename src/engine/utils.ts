import { PlusDiscSceneName, RouteDayName, RouteName, SceneName } from "../app/utils/types";
import { SCENE_ATTRS } from "../app/utils/constants";
import { strings } from "../translation/lang"
import { ThumbnailsGraphics } from "@tsukiweb/common/graphics";


//#endregion ###################################################################
//#region                          LABEL INFO
//##############################################################################

export function isThScene(label: string): label is SceneName {
	return /^\*?s\d+a?$/.test(label) ||
		["openning", "ending", "eclipse"].includes(label)
}
export function isPDScene(label: string): label is PlusDiscSceneName {
	return ["pd_alliance", "pd_experiment", "pd_geccha", "pd_geccha2"].includes(label)
}
export function isScene(label: string): label is SceneName | PlusDiscSceneName {
	return isThScene(label) || isPDScene(label)
}

function convertSceneName(name: string): string {
	if (!name.startsWith('$'))
		return name
	name = name.substring(1)
	const [r, d, s] = name.split('-') as [RouteName, RouteDayName, string]
	const dayName = strings.scenario.routes[r][d]
	return s ? `${dayName} - ${s}` : dayName
}

export function getSceneTitles(label: SceneName): { flg: string, titles: [string, string] } | string | undefined {
	let name = strings.scenario.scenes[label] ?? SCENE_ATTRS['scene-names'][label]
	if (!name)
		return undefined
	if (typeof name != "string") { // temporary workaround if client strings are not updated with v0.8.0.
		if ('title' in name)
			name = (name as {title: string}).title
	}
	if (name.startsWith('{')) {
		const i = name.indexOf('}')
		if (i < 0)
			return name
		const flg = name.substring(1, i)
		const titles = name.substring(i + 1).split('|').map(convertSceneName) as [string, string]
		if (titles.length != 2)
			return name
		return {flg, titles}
	} else {
		return convertSceneName(name)
	}
}

export function getSceneTitle(flags: string[], label: SceneName): string|undefined {
	const titles = getSceneTitles(label)
	if (typeof titles != 'object')
		return titles
	else if (flags.includes(titles.flg))
		return titles.titles[1]
	else return titles.titles[0]
}

export function getSceneGraph(scene: SceneName): ThumbnailsGraphics {
  return SCENE_ATTRS["scene-graphs"][scene] ?? { bg: "#000000" }
}
