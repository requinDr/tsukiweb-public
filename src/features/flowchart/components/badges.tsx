import { DY } from "@tsukiweb/common/flowchart/constants"
import { CharId } from "app/utils/types";

const HEART_PATH = `m0,2.5l-2.5,-2.5a1.66,1.66,0,1,1,2.5,-2.2a1.66,1.66,0,1,1,2.5,2.2`
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
  <path id="regard_heart" d={`${HEART_PATH}z`}/>
  {[1, 2, 3].map(n=>
    <g key={`regard_${n}`} id={`regard_${n}`}>
      <path d={`${HEART_PATH}
        ${"m-5,-2.2a1.66,1.66,0,1,1,2.5,-2.2a1.66,1.66,0,1,1,2.5,2.2".repeat(n-1)}`}/>
      <use href="#regard_+"/>
    </g>
  )}
  {[-4, -1].map(n=>
    <g key={`regard_${n}`} id={`regard_${n}`}>
      <path d={`${HEART_PATH}
        m-2.5,0.5l0.6,-0.5l-1.3,-1l0.7,-1.2
        ${`m-2.5,0a1.66,1.66,0,1,1,2.5,-2.2a1.66,1.66,0,1,1,2.5,2.2
        m-2.29,-0.3l-0.91,-0.7l0.7,-1.2`.repeat(-n-1)}`}/>
      <use href="#regard_-"/>
    </g>
  )}
  <path id="route_icon" d="M -0.54,-2.81 Q 0,-3.6 0.54,-2.81 L 1.07,-2.05
      Q 1.27,-1.75 1.62,-1.64 L 2.51,-1.38 Q 3.42,-1.12 2.84,-0.35 L 2.28,0.38
      Q 2.05,0.67 2.06,1.03 L 2.09,1.96 Q 2.11,2.92 1.21,2.59 L 0.34,2.28
      Q 0,2.16 -0.34,2.28 L -1.21,2.59 Q -2.11,2.92 -2.09,1.96 L -2.06,1.03
      Q -2.05,0.67 -2.28,0.38 L -2.84,-0.35 Q -3.42,-1.12 -2.51,-1.38 L -1.62,-1.64
      Q -1.27,-1.75 -1.07,-2.05 Z"/>
  <polygon id="flag-icon" points="0,-3.14 3,-1 1.85,2.53 -1.85,2.53 -3,-1" fill={FLAG_BACKGROUND} />
  <path id="flag-neg-icon" d="m-1.85,2.53 -1.15,-3.53 3,-2.14 3,2.14 -1.15,3.53zl3.35,-4.60" fill="#000" stroke="#800"/>
  <g id="sel-icon">
    <polygon points="0,-2.8 2.7,0 0,2.7 -2.7,0" fill="var(--active-connection)"/>
    <text y="1.6" stroke="none" fill="white" textAnchor="middle">
    ?
    </text>
  </g>
  <polygon id="cond-icon" points={`0,${C*1.5} ${-C},${C} ${-C},${-C} ${C},${-C} ${C},${C}`}/>
  <path id="cond-neg" d={`m ${-C},0l${C*2},0`} stroke="#500000"/>
</defs>
