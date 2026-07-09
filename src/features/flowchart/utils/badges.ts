import { strings } from "translation/lang";
import { CharId } from "app/utils/types";
import { SCENE_ATTRS } from "../../../app/utils/constants";
import { RouteEnding, endings } from "../../endings/utils/endings";
import FC from "../../../assets/game/flowchart.json"

export type BadgeEntry = {
  flag?: string,
  condition?: string | {condition: string, above?: string, below?: string},
  select?: {text: string, condition?: string}[],
  selectConditions?: (0|string)[]
  choiceN?: [[string, number]],
  ending?: {char: CharId, type: RouteEnding['type'] }
} & (
  { char: CharId, value: number } | {char?: never, value?: never}
)
const BADGE_MAP = new Map<string, BadgeEntry>()
let badgeMapLanguageKey = ""

function getBadgeMapLanguageKey() {
  return `${strings.id}:${strings.lastUpdate ?? ""}`
}

function buildBadgesMap() {
  BADGE_MAP.clear()
  badgeMapLanguageKey = getBadgeMapLanguageKey()

  for (const [char, entries] of Object.entries(FC.badges.points))
  for (const [id, value] of Object.entries(entries))
    BADGE_MAP.set(id, { char: char as CharId, value: value as number })

  for (const [flag, ids] of Object.entries(FC.badges.flags))
  for (const id of ids)
    BADGE_MAP.set(id, { ...BADGE_MAP.get(id), flag })

  for (const [id, texts] of Object.entries(strings.choices)) {
    const select = texts!.map(text=>({text}))
    BADGE_MAP.set(id, { ...BADGE_MAP.get(id), select })
    if (id.includes('f'))
      BADGE_MAP.set(id.replace('f', 's'), { ...BADGE_MAP.get(id.replace('f', 's')), select })
  }
  
  for (const [id, attrs] of Object.entries(FC.badges.select)) {
    if ('copy' in attrs) {
      BADGE_MAP.set(id, { ...BADGE_MAP.get(id), select: BADGE_MAP.get(attrs.copy)!.select })
    }
    if ('conditions' in attrs) {
      const entry = BADGE_MAP.get(id)!
      attrs.conditions.map((condition, i)=> {
        if (condition && entry?.select) entry.select[i].condition = condition as string
      })
    }
  }
  for (const [id, condition] of Object.entries(FC.badges.conditions)) {
    BADGE_MAP.set(id, { ...BADGE_MAP.get(id), condition })
  }
  for (const {scene: id, char, type} of Object.values(endings)) {
    BADGE_MAP.set(id, { ...BADGE_MAP.get(id), ending: {char, type}})
  }
}

export function getNodeBadges(nodeId: string) {
  if (BADGE_MAP.size == 0 || badgeMapLanguageKey !== getBadgeMapLanguageKey())
    buildBadgesMap()
  return BADGE_MAP.get(nodeId)
}
