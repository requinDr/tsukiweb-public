import { ViewRatio } from "@tsukiweb-common/constants"
import { ResolutionId, TranslationId, LangJson } from "translation/lang"

export type PageType = 'text'|'choice'|'skip'|'phase'
export type PageContent<T extends PageType> =
	T extends 'text' ? { text: string } :
	T extends 'choice' ? { choices: Choice[], selected?: number} :
	T extends 'skip' ? { scene: SceneName } :
	T extends 'phase' ? { } :
	never
export type PageArgs<T extends PageType> =
	T extends 'text' ? [string] :
	T extends 'choice' ? [Choice[]] :
	T extends 'skip' ? [SceneName] :
	T extends 'phase' ? [] :
	never

export type Choice = {
	index: number,
	str: string,
	label: LabelName,
}

export type RouteName = 'aki'|'ark'|'cel'|'his'|'koha'|'others'
export type RouteDayName<T extends RouteName=RouteName> = 
	T extends 'others' ? 'pro'|'epi'|'end'|'fin'
										 : `${number}${'a'|'b'}`

export type CharId = RouteName//Exclude<RouteName, "others">

export type SceneName = `s${number}${'a'|''}` |
	"openning" | "ending" | "eclipse"

export type FBlockName = `f${number}${''|'a'|'b'|'half'|'_0'}`

export type LabelName = SceneName | FBlockName | `skip${number}${'a'|''}` |
	'endofplay'

export type SettingsType = {
	// scene settings
	textSpeed: number
	autoClickDelay: number
	nextPageDelay: number
	fastForwardDelay: number
	enableSceneSkip: boolean // ask to skip scenes
	preventUnreadSkip: boolean
	// graphics settings
	font: string
	resolution: ResolutionId
	language: TranslationId
	fixedRatio: ViewRatio
	// H-related settings
	blurThumbnails: boolean
	warnHScenes: boolean
	// audio settings
	volume: {
		master: number
		track: number
		se: number
	}
	trackSource: keyof LangJson["audio"]["track-sources"]
	autoMute: boolean

	unlockEverything: boolean
	
	// saved progress
	eventImages: string[]
	completedScenes: string[]
}