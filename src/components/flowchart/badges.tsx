import { FcNode } from "utils/flowchart"
import { SCENE_WIDTH, SCENE_HEIGHT, COLUMN_WIDTH, DY } from "@tsukiweb-common/flowchart"
import { SCENE_ATTRS } from "utils/constants"
import { SceneName } from "types"
const HEART_OFFSET = `0,2.5`
const commonProps = {
    fill:"none",
    stroke:"white",
    strokeWidth:"0.15mm",
    strokeLinecap:"round",
    strokeLinejoin:"round"
} as const

export const BADGES_DEFINES = <defs>
    <linearGradient id="ark_grad" x1="0" x2="1" y1="1" y2="0">
        <stop offset="0" stopColor="var(--color-ark-1, #817f00)" />
        <stop offset="1" stopColor="var(--route-ark, #e7e300)" />
    </linearGradient>
    <linearGradient id="cel_grad" x1="0" x2="1" y1="1" y2="0">
        <stop offset="0" stopColor="var(--route-cel, #064694)" />
        <stop offset="1" stopColor="var(--color-cel-2, #07deff)" />
    </linearGradient>
    <linearGradient id="aki_grad" x1="0" x2="1" y1="1" y2="0">
        <stop offset="0" stopColor="var(--color-aki-1, #4f2910)" />
        <stop offset="1" stopColor="var(--route-aki, #c5651f)" />
    </linearGradient>
    <linearGradient id="his_grad" x1="0" x2="1" y1="1" y2="0">
        <stop offset="0" stopColor="var(--color-his-1, #850505)" />
        <stop offset="1" stopColor="var(--route-his, #e70909)" />
    </linearGradient>
    <linearGradient id="koha_grad" x1="0" x2="1" y1="1" y2="0">
        <stop offset="0" stopColor="var(--color-koha-1, #990099)" />
        <stop offset="1" stopColor="var(--route-koha, #ff00ff)" />
    </linearGradient>
    <linearGradient id="len_grad" x1="0" x2="1" y1="1" y2="0">
        <stop offset="0" stopColor="var(--color-ark-1, #242424)" />
        <stop offset="1" stopColor="var(--color-ark-2, #606060)" />
    </linearGradient>
    <linearGradient id="akira_grad" x1="0" x2="1" y1="1" y2="0">
        <stop offset="0" stopColor="var(--color-cel-1, #664c73)" />
        <stop offset="1" stopColor="var(--color-cel-2, #be59f0)" />
        <stop offset="1" stopColor="var(--color-cel-2, #ba5ce9)" />
    </linearGradient>
    <linearGradient id="nana_grad" x1="0" x2="1" y1="1" y2="0">
        <stop offset="0" stopColor="var(--color-aki-1, #1f3a65)" />
        <stop offset="1" stopColor="var(--color-aki-2, #3564af)" />
    </linearGradient>
    <path id="regard_+" d="m1.75,0.75l0,1.75m-0.875,-0.875l1.75,0" stroke="var(--regard-plus-color, #00ff00)" fill="none"/>
    <path id="regard_-" d="m1.75,0.85m-0.875,0.5l1.75,0" stroke="var(--regard-minus-color, #ff0000)" fill="none"/>
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
    <polygon id="flag-icon" points="0,-3.14 3,-1 1.85,2.53 -1.85,2.53 -3,-1" fill="#668a00" />
    <g id="sel-icon">
        <polygon points="0,-3 3,0 0,3 -3,0" fill="lime"/>
        <text fontFamily="sans-serif" fontSize="4" stroke="none" fill="white" alignmentBaseline="central" textAnchor="middle">
        ?
        </text>
    </g>
    <g id="cond-icon">
        <polygon points="0,-3 3,0 0,3 -3,0" fill="lime"/>
        <path d="m 2.5,1.5 l-2.5,2.5 -2.5,-2.5" strokeWidth="0.525mm"/>
        <path d="m 2.5,1.5 l-2.5,2.5 -2.5,-2.5 m 2.5,2.5 l 0,-2" stroke="lime"/>
    </g>
</defs>

type SceneBadgesProps = {
    node: FcNode
}

export function getNodeBadges(node: FcNode) {
    const [char, regard_entry] = Object.entries(SCENE_ATTRS.badges.regards).find(
        ([char, entries])=> Object.keys(entries).includes(node.id)) ?? [null, null]
    const flag = Object.entries(SCENE_ATTRS.badges.flags).find(
        ([flg, ids])=> ids.includes(node.id as SceneName))?.[0]
    
    return [
        flag,
        char ? [char, regard_entry[node.id as SceneName]]
             : [null, null]
    ] as const
}
export const SceneBadges = ({node}: SceneBadgesProps)=> {
    const [flag, [char, value]] = getNodeBadges(node)
    let regard_badge = undefined, flag_badge = undefined
    if (char) {
        const dx = node.right - (node.width > 0 ? COLUMN_WIDTH - node.width : 0)
        const dy = node.bottom - (node.height > 0 ? DY/2 : 0)
        regard_badge = <use href={`#regard_${value}`}
                            fill={`url(#${char}_grad`}
                            transform={`translate(${dx}, ${dy})`} />
    }
    if (flag) {
        const dx = node.left + (node.width > 0 ? COLUMN_WIDTH - node.width : 0)
        const dy = node.bottom - (node.height > 0 ? DY/2 : 0)
        flag_badge = <g transform={`translate(${dx}, ${dy})`}>
            <use href="#flag-icon"/>
            <text y="1.6" font-family="sans-serif" fontSize="4" stroke="none" fill="white" text-anchor="middle">
            {flag}
            </text>
        </g>
    }
    return <g {...commonProps}>{regard_badge}{flag_badge}</g>

}