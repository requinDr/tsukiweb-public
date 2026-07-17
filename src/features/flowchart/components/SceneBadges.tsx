import { FcNode } from "features/flowchart/utils/flowchart";
import { FLAG_BACKGROUND } from "./badges";
import { DY } from "@tsukiweb/common/flowchart";
import { CharId } from "app/utils/types";
import { RouteEnding } from "features/endings/utils/endings";
import { getNodeBadges } from "features/flowchart/utils/badges";

const REGARD_REGEX = /^%regard_(\w+)/
const BADGE_RIGHT_INSET = 3

const SelectBadge = ({node}: {node: FcNode})=> {
	return (
		<use
			className="badge"
			href="#sel-icon"
			transform={`translate(${node.centerX}, ${node.bottom})`}
		/>
	)
}

const RegardBadge = ({node, char, value}: {node: FcNode, char: CharId, value: number})=> {
	const dX = node.width > 0 ? BADGE_RIGHT_INSET : 0
	const dY = node.height > 0 ? DY / 2 : 0

	return (
		<use
			className="badge"
			href={`#regard_${value}`}
			fill={`url(#${char}_grad)`}
			transform={`translate(${node.right - dX}, ${node.bottom - dY})`}
		/>
	)
}

const FlagBadge = ({node, flag, above}: {node: FcNode, flag: string, above?: boolean})=> {
	const dX = node.width > 0 ? BADGE_RIGHT_INSET : 0
	const dY = node.height > 0 ? DY / 2 : 0
	
	return (
		<g className="badge" transform={`translate(${node.right - dX}, ${node.bottom - dY - (above ? DY * 2.2 : 0)})`}>
			<use href="#flag-icon" />
			<text y="1.6" stroke="none" fill="white" textAnchor="middle">
				{flag}
			</text>
		</g>
	)
}

const EndingBadge = ({node, char, type}: {node: FcNode, char: CharId, type: RouteEnding['type']})=> {
	const dX = node.width > 0 ? BADGE_RIGHT_INSET : 0
	const dY = node.height > 0 ? DY / 2 : 0
	
	return (
		<use
			className="badge"
			href="#route_icon"
			fill={`url(#${char}_grad)`}
			transform={`translate(${node.right - dX}, ${node.bottom - dY})`}
		/>
	)
}

type Condition = Exclude<Exclude<ReturnType<typeof getNodeBadges>, undefined>['condition'], undefined>
const ConditionBadge = ({node, condition}: {node: FcNode, condition: Condition})=> {
	let x, y, angle, iconX, iconY, icon, fill, negative
	if (typeof condition == 'object') {
		let above, below
		({condition, above, below} = condition)
		if (above) {
			const anchorNode = node.flowchart.getNode(above)
			x = anchorNode!.centerX
			y = anchorNode!.top - DY
		} else if (below) {
			const anchorNode = node.flowchart.getNode(below)
			x = anchorNode!.centerX
			y = anchorNode!.bottom + DY
		} else {
			x = node.centerX
			y = node.top - DY
		}
		if (x < node.centerX) {
			angle = -90
			iconX = DY*0.1
			iconY = DY*0.6
			x += DY+0.1
		} else if (x > node.centerX) {
			angle = 90
			iconX = -DY*0.1
			iconY = DY*0.6
			x -= DY+0.1
		} else {
			angle = 0
			iconX = 0
			iconY = DY*0.7
			y += DY+0.1
		}
	} else {
		angle = 0
		iconX = 0
		iconY = DY*0.7
		x = node.centerX
		y = node.top + 0.1
	}
	if (condition.includes('||') || condition.includes('&&')) {
		icon = "⋯"
		fill = "var(--active-connection)"
	} else if (condition!.startsWith('%flg')) {
		icon = condition[4]
		fill = FLAG_BACKGROUND
		negative = condition.endsWith('==0')
	} else if (condition.startsWith('%regard')) {
		icon = "♥"
		fill = `url(#${condition.match(REGARD_REGEX)![1]}_grad)`
	} else if (condition.startsWith('%clear')) {
		icon = "★"
		fill = "var(--active-connection)"
	} else {
		icon = "⋯"
		fill = "var(--active-connection)"
	}
	return <g className="badge" transform={`translate(${x},${y})`}>
		<use href="#cond-icon" fill={fill} {...(angle && {transform:`rotate(${angle})`})}/>
		<text x={iconX} y={iconY} textAnchor="middle"
				stroke="none" fill="white">
			{icon}
		</text>
		{negative && <use href="#cond-neg"/>}
	</g>
}


type SceneBadgesProps = {
	node: FcNode
}
export const SceneBadges = ({node}: SceneBadgesProps)=> {
	const badge = getNodeBadges(node.id)
	if (!badge) return null

	let { flag, char, value, select, condition, ending } = badge
	
	return (
		<>
			{char && <RegardBadge node={node} char={char} value={value!} />}

			{flag && <FlagBadge node={node} flag={flag} above={!!char} />}

			{select && <SelectBadge node={node} />}

			{condition && <ConditionBadge node={node} condition={condition} />}
			
			{ending && <EndingBadge node={node} {...ending} />}
		</>
	)
}