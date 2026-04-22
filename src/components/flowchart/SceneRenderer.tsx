import { SVGProps, memo, useCallback } from "react"
import { FcNode, getSceneGraph } from "utils/flowchart"
import { SceneName } from "types"
import cg from "utils/gallery"
import SceneImage from "./SceneImage"
import classNames from "classnames"
import { NavigationProps } from "@tsukiweb-common/input/arrowNavigation"
import { FcNodeState, usePopover, usePopoverTrigger } from "@tsukiweb-common/flowchart"


const UnseenScene = ({ node, ...props }: { node: FcNode }) => (
	<use {...props} className='fc-scene' id={node.id}
		href="#fc-scene-hidden"
		x={node.centerX} y={node.centerY}
		clipPath="url(#fc-scene-clip)" />
)

type SceneProps = {
	node: FcNode,
	onClick?: (id: SceneName) => void
} & Omit<SVGProps<SVGRectElement>, 'onClick'> & NavigationProps

const VisibleScene = memo(({ node, onClick, ...props }: SceneProps) => {
	const { closePopover } = usePopover()
	const trigger = usePopoverTrigger(node)
	const disabled = node.state === FcNodeState.DISABLED
	const graph = getSceneGraph(node.id as SceneName)

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
		"blur": graph.bg && cg.shouldBlur(graph.bg),
		"disabled": disabled
	})

	return (
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
				fill="transparent"
				pointerEvents="all"
				ry={1.6}
				style={{ cursor: disabled ? 'default' : 'pointer', outline: 'none' }}
				
				{...(!disabled && trigger)}
				onClick={!disabled ? onAction : undefined}
				onKeyDown={!disabled ? onAction : undefined}
				tabIndex={disabled ? -1 : 0}
				{...props}
			/>
		</g>
	)
})

export const SceneRenderer = ({ node, onClick, ...props }: SceneProps) => {

	switch (node.state) {
		case FcNodeState.HIDDEN:
			return null
		case FcNodeState.UNSEEN:
			return <UnseenScene node={node} {...props} />
		default:
			return <VisibleScene node={node} onClick={onClick} {...props} />
	}
}
