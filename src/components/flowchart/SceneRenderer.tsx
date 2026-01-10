import { SVGProps, memo, useCallback } from "react"
import { FcNode, FcNodeState } from "utils/flowchart"
import { TsukihimeSceneName } from "types"
import cg from "utils/gallery"
import SceneImage from "./SceneImage"
import classNames from "classnames"
import { NavigationProps } from "@tsukiweb-common/input/arrowNavigation"
import { useScenePopover, useScenePopoverTrigger } from "./ScenePopoverContext"


const UnseenScene = ({ node, ...props }: { node: FcNode }) => (
	<use {...props} className='fc-scene' id={node.id}
		href="#fc-scene-hidden"
		x={node.centerX} y={node.centerY}
		clipPath="url(#fc-scene-clip)" />
)

type SceneProps = {
	node: FcNode,
	onClick?: (id: TsukihimeSceneName) => void
} & Omit<SVGProps<SVGRectElement>, 'onClick'> & NavigationProps

const VisibleScene = memo(({ node, onClick, ...props }: SceneProps) => {
	const { closePopover } = useScenePopover()
	const trigger = useScenePopoverTrigger(node)
	const disabled = node.state === FcNodeState.DISABLED

	const onAction = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
		if ('key' in e && (e.key !== "Enter" || e.currentTarget !== e.target)) {
			return
		}
		e.stopPropagation()
		closePopover()
		onClick?.(node.id as TsukihimeSceneName)
	}, [closePopover, onClick, node.id])

	const classes = classNames("fc-scene", "unlocked", {
		"blur": node.graph?.bg && cg.shouldBlur(node.graph.bg),
		"active": node.active,
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
