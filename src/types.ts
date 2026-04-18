export type CharId = 'aki'|'ark'|'cel'|'his'|'koha'

export type RouteName = CharId |'others'
export type RouteDayName<T extends RouteName=RouteName> = 
	T extends 'others' ? 'pro'|'epi'|'end'|'fin'
										 : `${number}${'a'|'b'}`

export type SceneName = `s${number}${'a'|''}` |
	"openning" | "ending" | "eclipse"

export type PlusDiscSceneName =
	`pd_${"alliance" | "experiment" | "geccha" | "geccha2"}`

export type FBlockName = `f${number}${''|'a'|'b'|'half'|'_0'}`

export type LabelName = SceneName | PlusDiscSceneName | FBlockName |
	`skip${number}${'a'|''}` | 'endofplay'

export type Choice = {
	index: number
	str: string
	label: LabelName,
	disable?: boolean
}

export type GalleryImg = {
	group: CharId | "pd",
	h?: true,
	altOf?: string,
	source?: "unused" | "half-moon"
	unlockIds?: string[]
}