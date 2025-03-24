
import { memo, useState } from "react"
import { FcNode } from "./FcNode"
import { COLUMN_WIDTH, createTree, DY, SCENE_HEIGHT, SCENE_RECT_ATTRS, SCENE_WIDTH } from "utils/flowchart"

type Props = {
	back?: (sceneLoaded: boolean)=>void
	disabled?: boolean
}
const Flowchart = memo(({back, disabled = false}: Props)=> {
	const [tree] = useState<FcNode[]>(createTree)
	const [left, top, right, bottom] = tree.reduce((vb, node)=> [
		Math.min(vb[0], node.left),
		Math.min(vb[1], node.top),
		Math.max(vb[2], node.right),
		Math.max(vb[3], node.bottom),
	], [Number.MAX_VALUE, Number.MAX_VALUE, 0, 0])
	const width = right - left
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
			{tree.map(node=> node.render(disabled))}
		</svg>
	)
})

export default Flowchart