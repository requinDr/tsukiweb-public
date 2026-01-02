import { memo } from "react";
import { DY, FcNode, FcNodeState, OVERLAP_BREAK_LENGTH } from "utils/flowchart";
import classNames from "classnames";

type ConnectionPathProps = {
	from: FcNode
	to: FcNode
	mode?: 'playthrough' | 'viewer'
}

const ConnectionPath = memo(({ from, to, mode = 'viewer' }: ConnectionPathProps) => {
	const {centerX: x1, bottom: y1} = from
	const {centerX: x2, top: y2} = to

	let d = `M${x1},${y1}`
	if (x1 === x2) {
		d += `V${y2}`
	}	else if (y1 === y2) {
		d += `H${x2}`
	} else {
		const turnY = y2 - DY
		if (turnY > y1)
			d += `V${turnY}`
		d +=`H${x2}V${y2}`
	}

	const id = `${from.id}-${to.id}`
	let style: React.CSSProperties | undefined

	if (to.cutAt !== 0) {
		const totalLength = (y2 - y1) + Math.abs(x2 - x1)
		const bl = OVERLAP_BREAK_LENGTH
		const cutLength = to.cutAt * DY
		style = {
			strokeDasharray: `${totalLength - cutLength - bl/2} ${bl} ${cutLength - bl/2}`,
		}
	}

	let isDisabled: boolean
	if (mode === 'playthrough') {
		// only show paths that were actually traversed
		isDisabled = !from.flowchart.hasTransition(from.id, to.id)
	} else {
		// show all paths to/from enabled scenes
		isDisabled = from.state !== FcNodeState.ENABLED || to.state !== FcNodeState.ENABLED
	}
	
	const classes = classNames("fc-link", { disabled: isDisabled })

	return <path id={id} className={classes} d={d} style={style} />
})

export default ConnectionPath