import { DY } from "@tsukiweb/common/flowchart/constants"
import { BADGE_PATHS as BADGE_PATHS_BASE, BadgeBase, BadgeBaseProps, HeadSVGIcon, RegardBadge }
  from "@tsukiweb/common/icons/badges"
import { CharId } from "app/utils/types";

const C = DY*0.8 // unit used for condition badge
const BADGE_HALF = DY
export const BADGE_SIZE = 7
export const ROUTE_HEAD_RADIUS = 3

export const BADGE_PATHS = {...BADGE_PATHS_BASE,
  route: `M -0.54,-2.81 Q 0,-3.6 0.54,-2.81 L 1.07,-2.05
      Q 1.27,-1.75 1.62,-1.64 L 2.51,-1.38 Q 3.42,-1.12 2.84,-0.35 L 2.28,0.38
      Q 2.05,0.67 2.06,1.03 L 2.09,1.96 Q 2.11,2.92 1.21,2.59 L 0.34,2.28
      Q 0,2.16 -0.34,2.28 L -1.21,2.59 Q -2.11,2.92 -2.09,1.96 L -2.06,1.03
      Q -2.05,0.67 -2.28,0.38 L -2.84,-0.35 Q -3.42,-1.12 -2.51,-1.38 L -1.62,-1.64
      Q -1.27,-1.75 -1.07,-2.05 Z`,
  select: "M-4.6,0 -2,-2.5 2,-2.5 4.6,0 2,2.5 -2,2.5Z",
  cond: `M0,${C*1.5} ${-BADGE_HALF},${C} ${-BADGE_HALF},${-C} ${BADGE_HALF},${-C} ${BADGE_HALF},${C}Z`,
}

const headImage = (char: string) => `./res/chars/${char}.webp`

type CharBadgeProps = { char: CharId, value?: number } & BadgeBaseProps

export const CharPointBadge = ({char, ...props}: CharBadgeProps) =>
  <RegardBadge fill={`url(#${char}_grad)`} img={headImage(char)} {...props}/>

/** without `char`, white star for any route */
export const RouteBadge = ({char, ...props}: {char: CharId | null} & BadgeBaseProps) =>
  <BadgeBase {...props}>
    <path d={BADGE_PATHS.route} fill={char ? `url(#${char}_grad)` : 'white'}/>
    {char && <HeadSVGIcon img={headImage(char)} r={ROUTE_HEAD_RADIUS}
      shape={<path d={BADGE_PATHS.route}/>}/>}
  </BadgeBase>

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
</defs>
