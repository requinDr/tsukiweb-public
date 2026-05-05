import { SCENE_ATTRS } from "utils/constants"
import { CharId } from "types"
import { strings } from "translation/lang"
import { DY } from "@tsukiweb-common/flowchart/constants"

const HEART_OFFSET = `0,2.5`
const C = DY*0.8 // unit used for condition badge
export const FLAG_BACKGROUND = "#668a00"

function characterGradient(char: CharId) {
  return <linearGradient id={`${char}_grad`} x1="0" x2="1" y1="1" y2="0">
    <stop offset="0" stopColor={`color-mix(in oklch, var(--route-${char}) 80%, white)`} />
    <stop offset="1" stopColor={`color-mix(in oklch, var(--route-${char}) 80%, black)`} />
  </linearGradient>
}

export const BADGES_DEFINES = <defs>
  {characterGradient('ark')}
  {characterGradient('cel')}
  {characterGradient('aki')}
  {characterGradient('his')}
  {characterGradient('koha')}
  {/* TODO move to KT repository when possible
  <linearGradient id="len_grad" x1="0" x2="1" y1="1" y2="0">
    <stop offset="0" stopColor="var(--color-len-1, #242424)" />
    <stop offset="1" stopColor="var(--color-len-2, #606060)" />
  </linearGradient>
  <linearGradient id="akira_grad" x1="0" x2="1" y1="1" y2="0">
    <stop offset="0" stopColor="var(--color-akira-1, #664c73)" />
    <stop offset="1" stopColor="var(--color-akira-2, #be59f0)" />
    <stop offset="1" stopColor="var(--color-akira-2, #ba5ce9)" />
  </linearGradient>
  <linearGradient id="nana_grad" x1="0" x2="1" y1="1" y2="0">
    <stop offset="0" stopColor="var(--color-nana-1, #1f3a65)" />
    <stop offset="1" stopColor="var(--color-nana-2, #3564af)" />
  </linearGradient>
  */}
  <path id="regard_+" d="m1.75,0.75l0,1.75m-0.875,-0.875l1.75,0" stroke="var(--regard-plus-color, #00ff00)" fill="none"/>
  <path id="regard_-" d="m1.75,0.85m-0.875,0.5l1.75,0" stroke="var(--regard-minus-color, #ff0000)" fill="none"/>
  <path id="regard_heart" d={`m${HEART_OFFSET}l-2.5,-2.5a1.66,1.66,0,1,1,2.5,-2.2a1.66,1.66,0,1,1,2.5,2.2`} stroke="none"/>
  {[1, 2, 3].map(n=>
    <g key={`regard_${n}`} id={`regard_${n}`}>
      <path d={`m${HEART_OFFSET}l-2.5,-2.5a1.66,1.66,0,1,1,2.5,-2.2a1.66,1.66,0,1,1,2.5,2.2
        ${"m-5,-2.2a1.66,1.66,0,1,1,2.5,-2.2a1.66,1.66,0,1,1,2.5,2.2".repeat(n-1)}`}/>
      <use href="#regard_+"/>
    </g>
  )}
  {[-4, -1].map(n=>
    <g key={`regard_${n}`} id={`regard_${n}`}>
      <path d={`m${HEART_OFFSET}l-2.5,-2.5a1.66,1.66,0,1,1,2.5,-2.2a1.66,1.66,0,1,1,2.5,2.2
        m-2.5,0.5l0.6,-0.5l-1.3,-1l0.7,-1.2
        ${`m-2.5,0a1.66,1.66,0,1,1,2.5,-2.2a1.66,1.66,0,1,1,2.5,2.2
        m-2.29,-0.3l-0.91,-0.7l0.7,-1.2`.repeat(-n-1)}`}/>
      <use href="#regard_-"/>
    </g>
  )}
  <polygon id="flag-icon" points="0,-3.14 3,-1 1.85,2.53 -1.85,2.53 -3,-1" fill={FLAG_BACKGROUND} />
  <path id="flag-neg" d="m-1.85,2.53l3.35,-4.60" stroke="#500000"/>
  <g id="sel-icon">
    <polygon points="0,-2.8 2.7,0 0,2.7 -2.7,0" fill="var(--active-connection)"/>
    <text y="1.6" stroke="none" fill="white" textAnchor="middle">
    ?
    </text>
  </g>
  <polygon id="cond-icon" points={`0,${C*1.5} ${-C},${C} ${-C},${-C} ${C},${-C} ${C},${C}`}/>
  <path id="cond-neg" d={`m ${-C},0l${C*2},0`} stroke="#500000"/>
</defs>


type BadgeEntry = {
  flag?: string,
  condition?: string | {condition: string, above?: string, below?: string},
  select?: string[],
  selectConditions?: (0|string)[]
  choiceN?: [[string, number]]
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
    BADGE_MAP.set(id, { ...BADGE_MAP.get(id), select: texts })
    if (id.includes('f'))
      BADGE_MAP.set(id.replace('f', 's'), { ...BADGE_MAP.get(id.replace('f', 's')), select: texts })
  }
  for (const [id, {copy, conditions}] of Object.entries(SCENE_ATTRS.badges.select)) {
    if (copy) {
      BADGE_MAP.set(id, { ...BADGE_MAP.get(id), select: BADGE_MAP.get(copy)!.select })
    }
    if (conditions) {
      BADGE_MAP.get(id)!.selectConditions = conditions
    }
  }
  for (const [id, condition] of Object.entries(SCENE_ATTRS.badges.conditions)) {
    BADGE_MAP.set(id, { ...BADGE_MAP.get(id), condition })
  }
}
export function getNodeBadges(nodeId: string) {
  if (BADGE_MAP.size == 0)
    buildBadgesMap()
  return BADGE_MAP.get(nodeId)
}
