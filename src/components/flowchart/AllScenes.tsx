import { SVGProps, memo, useCallback } from "react"
import { FcNode, getSceneGraph } from "utils/flowchart"
import { SceneName } from "types"
import cg from "utils/gallery"
import SceneImage from "./SceneImage"
import classNames from "classnames"
import { NavigationProps } from "@tsukiweb-common/input/arrowNavigation"
import { FcNodeState, usePopover, usePopoverTrigger } from "@tsukiweb-common/flowchart"
import { SceneBadges } from "./badges"


type VisibleSceneProps = {
	node: FcNode
	graph: ReturnType<typeof getSceneGraph>
	shouldBlur: boolean
	closePopover: () => void
	onClick?: (id: SceneName) => void
} & Omit<SVGProps<SVGRectElement>, 'onClick'> & NavigationProps

export const VisibleScene = memo(({ node, graph, shouldBlur, closePopover, onClick, ...props }: VisibleSceneProps) => {
	const trigger = usePopoverTrigger(node)
	const disabled = node.state === FcNodeState.DISABLED

	const onAction = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
		if ('key' in e && (e.key !== "Enter" || e.currentTarget !== e.target)) {
			return
		}
		e.stopPropagation()
		closePopover()
		onClick?.(node.id as SceneName)
	}, [closePopover, onClick, node.id])

	const classes = classNames("fc-scene", "unlocked", {
		"active": node.active,
		"blur": shouldBlur,
		"disabled": disabled
	})

	return <>
		<g 
			id={`fc-scene-${node.id}`} 
			className={classes}
			transform={`translate(${node.centerX},${node.centerY})`}
			clipPath="url(#fc-scene-clip)"
		>
			<SceneImage node={node} />

			<rect
				x={-node.width / 2}
				y={-node.height / 2}
				width={node.width}
				height={node.height}
				ry={1.6}
				
				{...(!disabled && trigger)}
				onClick={!disabled ? onAction : undefined}
				onKeyDown={!disabled ? onAction : undefined}
				tabIndex={disabled ? -1 : 0}
				{...props}
			/>
		</g>
		<SceneBadges node={node} />
	</>
})


type SceneRendererProps = {
	nodes: FcNode[]
	activeNode?: FcNode
	onClick?: (id: SceneName) => void
} & Omit<SVGProps<SVGRectElement>, 'onClick'>

export const AllScenes = ({ nodes, activeNode, onClick }: SceneRendererProps) => {
	const { closePopover } = usePopover()

	const refX = activeNode?.column ?? 0
	const refY = activeNode?.navY ?? 0

	const sceneNodes = nodes.filter(n => n.scene)
	const unseenNodes = sceneNodes.filter(n => n.state === FcNodeState.UNSEEN)
	const activeNodes = sceneNodes.filter(n =>
		n.state !== FcNodeState.UNSEEN && n.state !== FcNodeState.HIDDEN)

	const navProps = (node: FcNode) => node.navY != null
		? { 'nav-scroll': 'smooth', 'nav-y': node.navY - refY, 'nav-x': node.column - refX }
		: {}

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
}
