
import { Fragment, SyntheticEvent } from "react"
import { COLUMN_WIDTH, DY, FcNode, FcNodeState, OVERLAP_BREAK_LENGTH, SCENE_HEIGHT, SCENE_RECT_ATTRS, SCENE_WIDTH, TsukihimeFlowchart } from "utils/flowchart"
import { TsukihimeSceneName } from "types"
import { PartialRecord } from "@tsukiweb-common/types"
import { SceneRenderer } from "./FcScene"


//#endregion ###################################################################
//#region                        SUB COMPONENTS
//##############################################################################

function connectionPath(from: FcNode, to: FcNode) {
	const {centerX: x1, bottom: y1} = from
	const {centerX: x2, top: y2} = to
	let path = `M ${x1},${y1}`
	if      (x1 == x2) path += ` V ${y2}`
	else if (y1 == y2) path += ` H ${x2}`
	else {
		const turnY = y2 - DY
		if (turnY > y1)
			path += ` V ${turnY}`
		path +=` H ${x2} V ${y2}`
	}
	const id = `${from.id}-${to.id}`
	const attrs: PartialRecord<'style', any> = { }
	if (to.cutAt != 0) {
		const totalLength = (y2 - y1) + Math.abs(x2 - x1)
		const bl = OVERLAP_BREAK_LENGTH
		const cutLength = to.cutAt * DY
		const dashes = [totalLength - cutLength - bl/2, bl, cutLength - bl/2]
		attrs.style = {strokeDasharray: dashes.join(' ')}
	}
	return <path key={id} id={id} className="fc-link" d={path} {...attrs} />
}

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
	flowchart ?: TsukihimeFlowchart,
	onSceneClick ?: (id: TsukihimeSceneName)=>void
}
const Flowchart = ({flowchart, onSceneClick}: Props)=> {
	if (!flowchart)
		flowchart = new TsukihimeFlowchart()
	const [left, top, right, bottom] = flowchart.listNodes().filter(n=>n.visible).reduce(
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
			{[...flowchart.listNodes().filter(node=>node.visible).map(node=>
				<Fragment key={node.id}>
					{[...node.parents
						// .filter(parent=>parent.state > FcNodeState.UNSEEN)
						.map(
						parent => connectionPath(parent, node))]}
					{node.scene &&
						<SceneRenderer node={node} onClick={onSceneClick}/>}
				</Fragment>
			)]}
		</svg>
	)
}

//#endregion ###################################################################

export default Flowchart