import { SCENE_WIDTH, SCENE_HEIGHT, FcNodeState, usePopoverTrigger } from "@tsukiweb-common/flowchart"
import { NavigationProps } from "@tsukiweb-common/input/arrowNavigation";
import classNames from "classnames";
import { SVGProps, useCallback } from "react";
import { SceneName } from "app/utils/types";
import { FcNode, getSceneGraph } from "features/flowchart/utils/flowchart"


type VisibleSceneProps = {
	node: FcNode
	graph: ReturnType<typeof getSceneGraph>
	shouldBlur: boolean
	closePopover: () => void
	onClick?: (id: SceneName) => void
} & Omit<SVGProps<SVGRectElement>, 'onClick'> & NavigationProps

const VisibleScene = ({ node, graph, shouldBlur, closePopover, onClick, ...props }: VisibleSceneProps) => {
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

	const interactionProps = disabled ? { tabIndex: -1 } : {
	  onClick: onAction,
	  onKeyDown: onAction,
	  tabIndex: 0,
	  ...trigger
	}

	return (
		<g 
			id={`fc-scene-${node.id}`} 
			className={classes}
			transform={`translate(${node.centerX},${node.centerY})`}
		>
			<SceneImage node={node} />

			<rect
				x={-node.width / 2}
				y={-node.height / 2}
				width={node.width}
				height={node.height}
				ry={1.6}
				
				{...interactionProps}
				{...props}
			/>
		</g>
	)
}

export default VisibleScene


type SceneImageProps = {
	node: FcNode
}
const SceneImage = ({ node }: SceneImageProps) => {
	const {file, left, top, width, height, nw, nh} = node.metadatas

	if (!file) {
		return <use href="#fc-scene-box" clipPath="url(#fc-scene-clip)" />
	}

	const ratioX = SCENE_WIDTH / width
	const ratioY = SCENE_HEIGHT / height

	return (
		<image
			href={file}
			x={-ratioX * left - SCENE_WIDTH / 2}
			y={-ratioY * top - SCENE_HEIGHT / 2}
			width={nw * ratioX}
			height={nh * ratioY}
			preserveAspectRatio="none"
			clipPath="url(#fc-scene-clip)"
		/>
	)
}

