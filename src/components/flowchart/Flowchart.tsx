
import { memo } from "react"
import { FcNode, GameFlowchart } from "utils/flowchart"
import { SceneName } from "types"
import { AllScenes } from "./AllScenes"
import { History } from "script/history"
import { COLUMN_WIDTH, DY, PopoverProvider, SCENE_HEIGHT, SCENE_WIDTH, SVG_DEFS } from "@tsukiweb-common/flowchart"
import ScenePopover from "./ScenePopover";
import AllConnections from "./AllConnections";
import { BADGES_DEFINES } from "./badges"


type Props = {
	history?: History,
	onSceneClick?: (id: SceneName) => void,
	mode?: 'playthrough' | 'viewer'
}
const Flowchart = ({history, onSceneClick, mode = 'viewer'}: Props)=> {
	const flowchart = new GameFlowchart(history)
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
	const minWidth = `${width/10}rem`
	const minHeight = `${height/10}rem`
	const maxWidth = `${100 * width / (2 * COLUMN_WIDTH)}%` // minimum 2 scenes visible
	const maxHeight = `${100 * height / (4 * (SCENE_HEIGHT + DY*2))}%` // minimum 4 scenes visible
	const activeNode = flowchart.getNode(flowchart.activeScene)

	
	return (
		<PopoverProvider renderContent={(item: FcNode) => <ScenePopover node={item} />}>
			<svg viewBox={`${left} ${top} ${width} ${height}`}
				className="flowchart"
				style={{
					minWidth: minWidth, maxWidth: maxWidth,
					minHeight: minHeight, maxHeight: maxHeight,
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
			</svg>
		</PopoverProvider>
	)
}

export default memo(Flowchart)