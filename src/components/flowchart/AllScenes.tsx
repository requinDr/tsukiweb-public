import { memo, SVGProps, useCallback } from "react"
import { FcNode, getSceneGraph } from "utils/flowchart"
import { SceneName } from "types"
import cg from "utils/gallery"
import { VisibleScene } from "./VisibleScene"
import { FcNodeState, usePopover } from "@tsukiweb-common/flowchart"


type SceneRendererProps = {
	nodes: FcNode[]
	activeNode?: FcNode
	onClick?: (id: SceneName) => void
} & Omit<SVGProps<SVGRectElement>, 'onClick'>

export const AllScenes = memo(({ nodes, activeNode, onClick }: SceneRendererProps) => {
	const { closePopover } = usePopover()

	const refX = activeNode?.column ?? 0
	const refY = activeNode?.navY ?? 0

	const sceneNodes = nodes.filter(n => n.scene)
	const unseenNodes = sceneNodes.filter(n => n.state === FcNodeState.UNSEEN)
	const activeNodes = sceneNodes.filter(n =>
		n.state !== FcNodeState.UNSEEN && n.state !== FcNodeState.HIDDEN)

	const navProps = useCallback((node: FcNode) => node.navY != null
		? { 'nav-scroll': 'smooth', 'nav-y': node.navY - refY, 'nav-x': node.column - refX }
		: {}, [refX, refY])

	return (
		<>
			{unseenNodes.map(node =>
				<use key={node.id} className='fc-scene' id={node.id}
					href="#fc-scene-hidden"
					x={node.centerX} y={node.centerY}
					clipPath="url(#fc-scene-clip)"
					{...navProps(node)} />
			)}
			{activeNodes.map(node => {
				const graph = getSceneGraph(node.id as SceneName)
				return (
					<VisibleScene key={node.id} node={node}
						graph={graph}
						shouldBlur={!!(graph.bg && cg.shouldBlur(graph.bg))}
						closePopover={closePopover}
						onClick={onClick}
						{...navProps(node)} />
				)
			})}
		</>
	)
})