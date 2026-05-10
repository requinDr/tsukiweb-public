import { strings } from "translation/lang";
import { CharId } from "types";
import { SCENE_ATTRS } from "./constants";
import { RouteEnding, endings } from "./endings";

type BadgeEntry = {
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

function buildBadgesMap() {
  for (const [char, entries] of Object.entries(SCENE_ATTRS.badges.regards))
  for (const [id, value] of Object.entries(entries))
    BADGE_MAP.set(id, { char: char as CharId, value: value as number })

  for (const [flag, ids] of Object.entries(SCENE_ATTRS.badges.flags))
  for (const id of ids)
    BADGE_MAP.set(id, { ...BADGE_MAP.get(id), flag })

  for (const [id, texts] of Object.entries(strings.choices)) {
    const select = texts!.map(text=>({text}))
    BADGE_MAP.set(id, { ...BADGE_MAP.get(id), select })
    if (id.includes('f'))
      BADGE_MAP.set(id.replace('f', 's'), { ...BADGE_MAP.get(id.replace('f', 's')), select })
  }
  for (const [id, {copy, conditions}] of Object.entries(SCENE_ATTRS.badges.select)) {

    if (copy) {
      BADGE_MAP.set(id, { ...BADGE_MAP.get(id), select: BADGE_MAP.get(copy)!.select })
    }
    if (conditions) {
      const entry = BADGE_MAP.get(id)!
      conditions.map((condition, i)=> {
        if (condition && entry?.select) entry.select[i].condition = condition
      })
    }
  }
  for (const [id, condition] of Object.entries(SCENE_ATTRS.badges.conditions)) {
    BADGE_MAP.set(id, { ...BADGE_MAP.get(id), condition })
  }
  for (const {scene: id, char, type} of Object.values(endings)) {
    BADGE_MAP.set(id, { ...BADGE_MAP.get(id), ending: {char, type}})
  }
}

export function getNodeBadges(nodeId: string) {
  if (BADGE_MAP.size == 0)
    buildBadgesMap()
  return BADGE_MAP.get(nodeId)
}
