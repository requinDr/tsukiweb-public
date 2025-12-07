
import { Fragment, memo } from "react"
import { COLUMN_WIDTH, DY, SCENE_HEIGHT, SCENE_RECT_ATTRS, SCENE_WIDTH, TsukihimeFlowchart } from "utils/flowchart"
import { TsukihimeSceneName } from "types"
import { SceneRenderer } from "./SceneRenderer"
import { History } from "utils/history"
import ConnectionPath from "./ConnectionPath"


//#endregion ###################################################################
//#region                        SUB COMPONENTS
//##############################################################################

const SVG_DEFS = <>
	<defs>
		<radialGradient id="hidden-scene-gradient">
			<stop offset="0%" stopColor="black" />
			<stop offset="50%" stopColor="#111" />
			<stop offset="95%" stopColor="#222" />
		</radialGradient>
		<rect id="fc-scene-outline" {...SCENE_RECT_ATTRS} rx={SCENE_HEIGHT/14} />
		<rect id="fc-scene-background" {...SCENE_RECT_ATTRS} />
		<g id="fc-scene-hidden">
			<rect {...SCENE_RECT_ATTRS} rx={SCENE_HEIGHT/10} fill="url(#hidden-scene-gradient)" />
			<line x1={-SCENE_WIDTH/2} y1={-SCENE_HEIGHT/2} stroke="black"
						x2={ SCENE_WIDTH/2} y2={ SCENE_HEIGHT/2} strokeWidth={0.4}/>
			<line x1={-SCENE_WIDTH/2} y1={ SCENE_HEIGHT/2} stroke="black"
						x2={ SCENE_WIDTH/2} y2={-SCENE_HEIGHT/2} strokeWidth={0.4}/>
			<rect {...SCENE_RECT_ATTRS} rx={SCENE_HEIGHT/10} />
		</g>
	</defs>
	<clipPath id="fc-scene-clip">
		<use href="#fc-scene-outline"/>
	</clipPath>
</>

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

	return (
		<svg viewBox={`${left} ${top} ${width} ${height}`}
			style={{
				minWidth: minWidth, maxWidth: maxWidth,
				minHeight: minHeight, maxHeight: maxHeight,
				overflow: "visible"
			}}
			version="1.1"
			xmlns="http://www.w3.org/2000/svg">
			{SVG_DEFS}
			{visibleNodes.map(node=>
				<Fragment key={node.id}>
					{[...node.parents.map(
						parent => <ConnectionPath key={`${parent.id}-${node.id}`} from={parent} to={node} />
					)]}
					{node.scene && <SceneRenderer node={node}
						{...(node.navY != null && { 'nav-scroll': 'smooth',
							'nav-y': node.navY - refY,
							'nav-x': node.column - refX	})}
						onClick={onSceneClick}/>
					}
				</Fragment>
			)}
		</svg>
	)
}

//#endregion ###################################################################

export default memo(Flowchart)