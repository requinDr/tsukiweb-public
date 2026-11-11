import { strings } from "translation/lang";
import { CharId } from "app/utils/types";
import { RouteEnding, endings } from "../../endings/utils/endings";
import FC from "../../../assets/game/flowchart.json"

export type BadgeEntry = {
  flag?: string,
  condition?: string | {condition: string, above?: string, below?: string},
  select?: {text: string, condition?: string}[],
  ending?: {char: CharId, type: RouteEnding['type'] }
} & (
  { char: CharId, value: number } | {char?: never, value?: never}
)
const BADGE_MAP = new Map<string, BadgeEntry>()
let badgeMapLanguageKey = ""

function getBadgeMapLanguageKey() {
  return `${strings.id}:${strings.lastUpdate ?? ""}`
}

function addBadge(id: string, badge: Partial<BadgeEntry>) {
  BADGE_MAP.set(id, { ...BADGE_MAP.get(id), ...badge } as BadgeEntry)
}

function buildBadgesMap() {
  BADGE_MAP.clear()
  badgeMapLanguageKey = getBadgeMapLanguageKey()

  for (const [char, entries] of Object.entries(FC.badges.points))
    for (const [id, value] of Object.entries(entries))
      addBadge(id, { char: char as CharId, value: value as number })

  for (const [flag, ids] of Object.entries(FC.badges.flags))
    for (const id of ids)
      addBadge(id, { flag })

  for (const [id, texts] of Object.entries(strings.choices)) {
    const select = texts!.map(text=>({text}))
    addBadge(id, { select })
    if (id.includes('f'))
      addBadge(id.replace('f', 's'), { select })
  }

  for (const [id, attrs] of Object.entries(FC.badges.select)) {
    if ('copy' in attrs)
      addBadge(id, { select: BADGE_MAP.get(attrs.copy)!.select })
    const select = BADGE_MAP.get(id)?.select
    if (select && 'conditions' in attrs)
      attrs.conditions.forEach((condition, i) => {
        if (condition) select[i].condition = condition as string
      })
  }
  for (const [id, condition] of Object.entries(FC.badges.conditions))
    addBadge(id, { condition })
  for (const {scene: id, char, type} of Object.values(endings))
    addBadge(id, { ending: {char, type} })
}

export function getNodeBadges(nodeId: string) {
  if (BADGE_MAP.size == 0 || badgeMapLanguageKey !== getBadgeMapLanguageKey())
    buildBadgesMap()
  return BADGE_MAP.get(nodeId)
}
