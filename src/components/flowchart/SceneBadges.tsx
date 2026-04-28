import { FcNode } from "utils/flowchart";
import { FLAG_BACKGROUND, getNodeBadges } from "./badges";
import { COLUMN_WIDTH, DY } from "@tsukiweb-common/flowchart";

const REGARD_REGEX = /^%regard_(\w+)/

type SceneBadgesProps = {
	node: FcNode
}
export const SceneBadges = ({node}: SceneBadgesProps)=> {
	const badge = getNodeBadges(node.id)
	if (!badge) return null

	const { flag, char, value, select, condition } = badge
	const { bottom, top, left, right, width, height, centerX } = node
	
	const dX = (width > 0 ? COLUMN_WIDTH - width : 0)
	let y = bottom - (height > 0 ? DY / 2 : 0)

	let condIcon, condFill
	if (condition) {
		if (condition.includes('||') || condition.includes('&&')) {
			condIcon = "⋯"
			condFill = "var(--active-connection)"
		} else if (condition.startsWith('%flg')) {
			condIcon = condition[4]
			condFill = FLAG_BACKGROUND
		} else if (condition.startsWith('%regard')) {
			condIcon = "♥"
			condFill = `url(#${condition.match(REGARD_REGEX)![1]}_grad)`
		} else if (condition.startsWith('%clear')) {
			condIcon = "★"
			condFill = "var(--active-connection)"
		}
	}
	
	return (
		<>
			{char &&
				<use key="rgd" className="badge" href={`#regard_${value}`}
					fill={`url(#${char}_grad)`}
					transform={`translate(${right - dX}, ${y})`} />
			}

			{flag &&
				<g key="flg" className="badge" transform={`translate(${left + dX}, ${y})`}>
					<use href="#flag-icon" />
					<text y="1.6" stroke="none" fill="white" textAnchor="middle">
						{flag}
					</text>
				</g>
			}

			{select &&
				<use key="sel" className="badge" href="#sel-icon"
					transform={`translate(${centerX}, ${bottom + DY})`} />
			}

			{condition && condIcon &&
				<g key="if" className="badge" transform={`translate(${centerX}, ${top - DY})`}>
					<use href="#cond-icon" fill={condFill} />
					<text y="1.6" stroke="none" fill="white" textAnchor="middle">
						{condIcon}
					</text>
				</g>
			}
		</>
	)
}