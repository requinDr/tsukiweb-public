
import { memo, useRef } from "react"
import { FcNode, GameFlowchart } from "features/flowchart/utils/flowchart"
import { SceneName } from "app/utils/types"
import { AllScenes } from "./AllScenes"
import { History } from "engine/history"
import { COLUMN_WIDTH, DY, PopoverProvider, SCENE_HEIGHT, SCENE_WIDTH, SVG_DEFS } from "@tsukiweb/common/flowchart"
import { usePanZoom } from "@tsukiweb/common/hooks"
import ScenePopover from "./ScenePopover";
import AllConnections from "./AllConnections";
import { BADGES_DEFINES } from "./badges"
import AllBadges from "./AllBadges"
import { settings } from "engine/settings"
import { useObserved } from "@tsukiweb/common/utils/Observer"
import { useStrings } from "translation/lang"


type Props = {
	history?: History,
	onSceneClick?: (id: SceneName) => void,
	mode?: 'playthrough' | 'viewer'
}

const Flowchart = ({history, onSceneClick, mode = 'viewer'}: Props)=> {
	useStrings()
	const flowchart = new GameFlowchart(history)
	const svgRef = useRef<SVGSVGElement>(null)
	const stageRef = useRef<HTMLDivElement>(null)
	useObserved(settings, 'flowchartBadges') // refresh flowchart when toggling badges display
	const visibleNodes = flowchart.listNodes().filter(n=>n.visible)
	let [left, top, right, bottom] = visibleNodes.reduce(
		(vb, node)=> [
			Math.min(vb[0], node.left),
			Math.min(vb[1], node.top),
			Math.max(vb[2], node.right),
			Math.max(vb[3], node.bottom),
		], [Number.MAX_VALUE, Number.MAX_VALUE, 0, 0])
		
	// add small padding
	left -= (COLUMN_WIDTH - SCENE_WIDTH)
	top -= DY
	right += (COLUMN_WIDTH - SCENE_WIDTH)
	bottom += DY

	const width = Math.max(right - left, 10*COLUMN_WIDTH) // viewbox for at least 10 columns, otherwise it's too zoomed in
	const height = bottom - top
	const size = {
		minWidthRem: width / 10,
		minHeightRem: height / 10,
		maxWidthPct: 100 * width / (2 * COLUMN_WIDTH), // minimum 2 scenes visible
		maxHeightPct: 100 * height / (4 * (SCENE_HEIGHT + DY*2)), // minimum 4 scenes visible
	}
	const activeNode = flowchart.getNode(flowchart.activeScene)
	usePanZoom(svgRef, {
		maxScale: 3,
		minScale: 0.45,
		minVisible: '50%',
		stageRef,
		viewportSelector: '.scroll-container',
	})
	
	return (
		<PopoverProvider renderContent={(item: FcNode) => <ScenePopover node={item} />}>
			<div className="panzoom-stage" ref={stageRef}>
				<svg viewBox={`${left} ${top} ${width} ${height}`}
					ref={svgRef}
					className="flowchart"
					style={{
						minWidth: `max(${size.minWidthRem}rem, 100cqi)`, maxWidth: `${size.maxWidthPct}%`,
						minHeight: `${size.minHeightRem}rem`, maxHeight: `${size.maxHeightPct}%`,
					}}
					version="1.1"
					xmlns="http://www.w3.org/2000/svg">
					{SVG_DEFS}
					{BADGES_DEFINES}
					<g className="fc-connections">
						<AllConnections fcNodes={visibleNodes} mode={mode} />
					</g>
					<g className="fc-scenes">
						<AllScenes
							nodes={visibleNodes}
							activeNode={activeNode}
							onClick={onSceneClick}
						/>
					</g>
					<g className="fc-badges">
						{settings.flowchartBadges &&
							<AllBadges nodes={visibleNodes} />
						}
					</g>
				</svg>
			</div>
		</PopoverProvider>
	)
}

export default memo(Flowchart)