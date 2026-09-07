import { useMemo, memo } from "react"
import { FcNode } from "features/flowchart/utils/flowchart"
import { DY, FcNodeState, OVERLAP_BREAK_LENGTH } from "@tsukiweb/common/flowchart"

type Props = {
	fcNodes: FcNode[]
	mode?: 'playthrough' | 'viewer'
}

type DashedPath = {
	id: string
	group?: string
	d: string
	strokeDasharray: string
}

function buildPathD(x1: number, y1: number, x2: number, y2: number): string {
	if (x1 === x2) return `M${x1},${y1}V${y2}`
	if (y1 === y2) return `M${x1},${y1}H${x2}`

	const turnY = x2 > x1 ? y1 + DY : y2 - DY

	return  turnY > y1
		? `M${x1},${y1}V${turnY}H${x2}V${y2}`
		: `M${x1},${y1}H${x2}V${y2}`
}

const AllConnections = ({ fcNodes, mode = 'viewer' }: Props) => {
	const { disabledD, enabledPaths, enabledDashed, disabledDashed } = useMemo(() => {
		const disabledPaths: string[] = []
		const enabledByGroup = new Map<string|undefined, string[]>()
		const enabledDashed: DashedPath[] = []
		const disabledDashed: DashedPath[] = []
		const playthrough = mode === "playthrough"

		for (const node of fcNodes) {
			const { centerX: x2, top: y2 } = node

			for (const parent of node.parents) {
				const { centerX: x1, bottom: y1 } = parent
				const group = parent.group

				const disabled = playthrough
					? !parent.flowchart.hasTransition(parent.id, node.id)
					: parent.state !== FcNodeState.ENABLED || node.state !== FcNodeState.ENABLED
				const d = buildPathD(x1, y1, x2, y2)

				if (node.cutAt !== 0) {
					const totalLength = (y2 - y1) + Math.abs(x2 - x1)
					const cutLength = node.cutAt * DY
					const halfBreakLength = OVERLAP_BREAK_LENGTH / 2
					const path = {
						id: `${parent.id}-${node.id}`,
						group: group,
						d,
						strokeDasharray:
							`${totalLength - cutLength - halfBreakLength} ` +
							`${OVERLAP_BREAK_LENGTH} ` +
							`${cutLength - halfBreakLength}`,
					}

					if (disabled) disabledDashed.push(path)
					else enabledDashed.push(path)

					continue
				}

				if (disabled) {
					disabledPaths.push(d)
					continue
				}

				const paths = enabledByGroup.get(group)

				if (paths) paths.push(d)
				else enabledByGroup.set(group, [d])
			}
		}

		const enabledPaths = Array.from(enabledByGroup, ([group, paths]) => [
			group, paths.join(" ")
		] as const)

		return {
			disabledD: disabledPaths.join(' '),
			enabledPaths: enabledPaths,
			enabledDashed,
			disabledDashed
		}
	}, [fcNodes, mode])

	return <>
		{disabledDashed.map(({ id, d, group, strokeDasharray }) =>
			<path
				key={id} id={id}
				className={`fc-link disabled${group ? ` group-${group}` : ''}`}
				d={d}
				strokeDasharray={strokeDasharray}
			/>
		)}
		{disabledD &&
			<path className="fc-link disabled" d={disabledD} />
		}
		{enabledPaths.map(([group, d]) =>
			<path
				key={group ?? "__ungrouped"}
				className={`fc-link enabled${group ? ` group-${group}` : ''}`}
				d={d}
			/>
		)}
		{enabledDashed.map(({ id, d, group, strokeDasharray }) =>
			<path
				key={id} id={id}
				className={`fc-link enabled${group ? ` group-${group}` : ''}`}
				d={d}
				strokeDasharray={strokeDasharray}
			/>
		)}
	</>
}

export default memo(AllConnections)