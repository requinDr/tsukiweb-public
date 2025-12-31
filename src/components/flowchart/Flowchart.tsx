
import { memo } from "react"
import { buildConnections, COLUMN_WIDTH, DY, SCENE_HEIGHT, SCENE_RECT_ATTRS, SCENE_WIDTH, TsukihimeFlowchart } from "utils/flowchart"
import { TsukihimeSceneName } from "types"
import { SceneRenderer } from "./SceneRenderer"
import { History } from "script/history"
import ConnectionPath from "./ConnectionPath"


//#endregion ###################################################################
//#region                        SUB COMPONENTS
//##############################################################################

const SVG_DEFS = (
	<defs>
		<radialGradient id="hidden-scene-gradient">
			<stop offset="0%" stopColor="black" />
			<stop offset="50%" stopColor="#111" />
			<stop offset="95%" stopColor="#222" />
		</radialGradient>
		<clipPath id="fc-scene-clip">
			<rect {...SCENE_RECT_ATTRS} rx={SCENE_HEIGHT/14} />
		</clipPath>
		<rect id="fc-scene-outline" {...SCENE_RECT_ATTRS} rx={SCENE_HEIGHT/14} />
		<rect id="fc-scene-background" {...SCENE_RECT_ATTRS} />
		<symbol id="fc-scene-hidden" overflow="visible">
			<rect {...SCENE_RECT_ATTRS} rx={SCENE_HEIGHT/10} fill="url(#hidden-scene-gradient)" />
			<path d={`M${-SCENE_WIDTH/2},${-SCENE_HEIGHT/2} L${SCENE_WIDTH/2},${SCENE_HEIGHT/2} M${-SCENE_WIDTH/2},${SCENE_HEIGHT/2} L${SCENE_WIDTH/2},${-SCENE_HEIGHT/2}`} stroke="black" strokeWidth={0.4} />
			<rect {...SCENE_RECT_ATTRS} rx={SCENE_HEIGHT/10} />
		</symbol>
	</defs>
)

//#endregion ###################################################################
//#region                           FLOWCHART
//##############################################################################

type Props = {
	history?: History,
	onSceneClick?: (id: TsukihimeSceneName) => void
}
const Flowchart = ({history, onSceneClick}: Props)=> {
	const flowchart = new TsukihimeFlowchart(history)
	const visibleNodes = flowchart.listNodes().filter(n=>n.visible)
	const [left, top, right, bottom] = visibleNodes.reduce(
		(vb, node)=> [
			Math.min(vb[0], node.left),
			Math.min(vb[1], node.top),
			Math.max(vb[2], node.right),
			Math.max(vb[3], node.bottom),
		], [Number.MAX_VALUE, Number.MAX_VALUE, 0, 0])
	const width = Math.max(right - left, 10*COLUMN_WIDTH) // viewbox for at least 10 columns, otherwise it's too zoomed in
	const height = bottom - top
	const minWidth = `${width/8}rem`
	const minHeight = `${height/8}rem`
	const maxWidth = `${100 * width / (2 * COLUMN_WIDTH)}%` // minimum 2 scenes visible
	const maxHeight = `${100 * height / (4 * (SCENE_HEIGHT + DY*2))}%` // minimum 4 scenes visible
	const activeNode = flowchart.getNode(flowchart.activeScene)
	let refX: number, refY: number
	if (activeNode)
		refX = activeNode.column, refY = activeNode.navY!
	else
		refX = refY = 0

	const connections = buildConnections(visibleNodes)
	
	return (
		<svg viewBox={`${left} ${top} ${width} ${height}`}
			className="flowchart"
			style={{
				minWidth: minWidth, maxWidth: maxWidth,
				minHeight: minHeight, maxHeight: maxHeight,
			}}
			version="1.1"
			xmlns="http://www.w3.org/2000/svg">
			{SVG_DEFS}
			<g className="fc-connections">
				{connections.map(c => 
					<ConnectionPath key={`${c.from.id}-${c.to.id}`} from={c.from} to={c.to} />
				)}
			</g>
			<g className="fc-scenes">
				{visibleNodes.map(node=>
					node.scene && <SceneRenderer key={node.id} node={node}
						{...(node.navY != null && { 'nav-scroll': 'smooth',
							'nav-y': node.navY - refY,
							'nav-x': node.column - refX	})}
						onClick={onSceneClick}/>
				)}
			</g>
		</svg>
	)
}

//#endregion ###################################################################

export default memo(Flowchart)