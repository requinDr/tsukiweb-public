import { useMemo, memo } from "react"
import { FcNode } from "utils/flowchart"
import { DY, FcNodeState, OVERLAP_BREAK_LENGTH } from "@tsukiweb-common/flowchart"

type Props = {
	fcNodes: FcNode[]
	mode?: 'playthrough' | 'viewer'
}

type DashedPath = {
	id: string
	d: string
	disabled: boolean
	style: React.CSSProperties
}

function buildPathD(x1: number, y1: number, x2: number, y2: number): string {
	let d = `M${x1},${y1}`
	if (x1 === x2)        d += `V${y2}`
	else if (y1 === y2)   d += `H${x2}`
	else {
		const turnY = x2 > x1 ? y1 + DY : y2 - DY
		if (turnY > y1) d += `V${turnY}`
		d += `H${x2}V${y2}`
	}
	return d
}

const AllConnections = ({ fcNodes, mode = 'viewer' }: Props) => {
	const { disabledD, enabledD, dashed } = useMemo(() => {
		const disabledSegs: string[] = []
		const enabledSegs: string[] = []
		const dashed: DashedPath[] = []

		for (const node of fcNodes) {
			for (const parent of node.parents) {
				const { centerX: x1, bottom: y1 } = parent
				const { centerX: x2, top: y2 } = node

				const isDisabled = mode === 'playthrough'
					? !parent.flowchart.hasTransition(parent.id, node.id)
					: parent.state !== FcNodeState.ENABLED || node.state !== FcNodeState.ENABLED

				const d = buildPathD(x1, y1, x2, y2)

				if (node.cutAt !== 0) {
					const totalLength = (y2 - y1) + Math.abs(x2 - x1)
					const bl = OVERLAP_BREAK_LENGTH
					const cutLength = node.cutAt * DY
					dashed.push({
						id: `${parent.id}-${node.id}`,
						d,
						disabled: isDisabled,
						style: {
							strokeDasharray: `${totalLength - cutLength - bl / 2} ${bl} ${cutLength - bl / 2}`,
						},
					})
				} else {
					(isDisabled ? disabledSegs : enabledSegs).push(d)
				}
			}
		}

		return {
			disabledD: disabledSegs.join(' '),
			enabledD:  enabledSegs.join(' '),
			dashed,
		}
	}, [fcNodes, mode])

	return <>
		{disabledD && <path className="fc-link disabled" d={disabledD} />}
		{enabledD  && <path className="fc-link enabled" d={enabledD}  />}
		{dashed.map(({ id, d, disabled, style }) => (
			<path
				key={id} id={id}
				className={disabled ? "fc-link disabled" : "fc-link enabled"}
				d={d}
				style={style}
			/>
		))}
	</>
}

export default memo(AllConnections)