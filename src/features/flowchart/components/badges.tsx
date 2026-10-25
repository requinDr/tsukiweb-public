import { DY } from "@tsukiweb/common/flowchart/constants"
import { CharId } from "app/utils/types";

const HEART_PATH = `m0,2.5l-2.5,-2.5a1.66,1.66,0,1,1,2.5,-2.2a1.66,1.66,0,1,1,2.5,2.2`
const C = DY*0.8 // unit used for condition badge
const BADGE_HALF = DY
export const FLAG_BACKGROUND = "#202020"
export const STRIKE_COLOR = "#ff3b3b"
export const FLAG_CONTENT = { x: 0.15, y: -0.55, scale: 0.95 }
export const FLAG_CONTENT_TRANSFORM = `translate(${FLAG_CONTENT.x},${FLAG_CONTENT.y}) scale(${FLAG_CONTENT.scale})`
export const FLAG_VIEWBOX = "-3.5 -3.6 7 7.1"

export const BADGE_PATHS = {
  heart: `${HEART_PATH}z`,
  regard: (n: number) => n > 0
    ? `${HEART_PATH}
        ${"m-5,-2.2a1.66,1.66,0,1,1,2.5,-2.2a1.66,1.66,0,1,1,2.5,2.2".repeat(n-1)}`
    : `${HEART_PATH}
        m-2.5,0.5l0.6,-0.5l-1.3,-1l0.7,-1.2
        ${`m-2.5,0a1.66,1.66,0,1,1,2.5,-2.2a1.66,1.66,0,1,1,2.5,2.2
        m-2.29,-0.3l-0.91,-0.7l0.7,-1.2`.repeat(-n-1)}`,
  regardPlus: "m1.75,0.75l0,1.75m-0.875,-0.875l1.75,0",
  regardMinus: "m1.75,0.85m-0.875,0.5l1.75,0",
  route: `M -0.54,-2.81 Q 0,-3.6 0.54,-2.81 L 1.07,-2.05
      Q 1.27,-1.75 1.62,-1.64 L 2.51,-1.38 Q 3.42,-1.12 2.84,-0.35 L 2.28,0.38
      Q 2.05,0.67 2.06,1.03 L 2.09,1.96 Q 2.11,2.92 1.21,2.59 L 0.34,2.28
      Q 0,2.16 -0.34,2.28 L -1.21,2.59 Q -2.11,2.92 -2.09,1.96 L -2.06,1.03
      Q -2.05,0.67 -2.28,0.38 L -2.84,-0.35 Q -3.42,-1.12 -2.51,-1.38 L -1.62,-1.64
      Q -1.27,-1.75 -1.07,-2.05 Z`,
  flag: "M-2.9,-3 Q0.15,-3.6 3.2,-3 V2.4 Q0.15,1.8 -2.9,2.4Z",
  flagPole: "M-3.2,-3.2 V3.2",
  strike: "M-3.2,-3.2 L3.2,3.2",
  select: "M-4.6,0 -2,-2.5 2,-2.5 4.6,0 2,2.5 -2,2.5Z",
  cond: `M0,${C*1.5} ${-BADGE_HALF},${C} ${-BADGE_HALF},${-C} ${BADGE_HALF},${-C} ${BADGE_HALF},${C}Z`,
}

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
  <path id="regard_+" d={BADGE_PATHS.regardPlus} stroke="var(--regard-plus-color, #00ff00)" fill="none"/>
  <path id="regard_-" d={BADGE_PATHS.regardMinus} stroke="var(--regard-minus-color, #ff0000)" fill="none"/>
  <path id="regard_heart" d={BADGE_PATHS.heart}/>
  <g id="regard_1">
    <path d={BADGE_PATHS.regard(1)}/>
    <use href="#regard_+"/>
  </g>
  <g id="regard_-1">
    <path d={BADGE_PATHS.regard(-1)}/>
    <use href="#regard_-"/>
  </g>
  <path id="route_icon" d={BADGE_PATHS.route}/>
  <g id="flag-icon">
    <path d={BADGE_PATHS.flagPole} fill="none" stroke="white" strokeLinecap="round"/>
    <path d={BADGE_PATHS.flag} fill={FLAG_BACKGROUND}/>
  </g>
  <g id="flag-neg-icon">
    <use href="#flag-icon"/>
    <path d={BADGE_PATHS.strike} stroke={STRIKE_COLOR} strokeWidth="1" strokeLinecap="round"/>
  </g>
</defs>
