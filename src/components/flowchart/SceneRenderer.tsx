import { useState } from "react"
import { FcNode, FcNodeState } from "utils/flowchart"
import { TsukihimeSceneName } from "types"
import { flip, autoUpdate } from "@floating-ui/dom";
import { useFloating, useHover, useInteractions } from "@floating-ui/react";
import { createPortal } from "react-dom"
import * as m from "motion/react-m"
import cg from "utils/gallery"
import SceneImage from "./SceneImage"
import ScenePopover from "./ScenePopover"
import classNames from "classnames"


let rootElement: HTMLElement | null = null
const getRootElement = () => {
	if (!rootElement) {
		rootElement = document.getElementById("root")
	}
	return rootElement!
}


const FLOATING_MIDDLEWARE = [flip()]
const useScenePopover = () => {
	const [isOpen, setIsOpen] = useState(false)
	const { refs, floatingStyles, context } = useFloating({
		placement: "right",
		whileElementsMounted: autoUpdate,
		open: isOpen,
		onOpenChange: setIsOpen,
		middleware: FLOATING_MIDDLEWARE
	})
	const hover = useHover(context, {
		delay: { open: 200, close: 50 },
	})
	const { getReferenceProps } = useInteractions([hover])

	return { isOpen, setIsOpen, refs, floatingStyles, context, getReferenceProps }
}

type SceneProps = {
	node: FcNode,
	onClick?: (id: TsukihimeSceneName) => void
}

const UnseenScene = ({ node }: { node: FcNode }) => (
	<g className='fc-scene' id={node.id}
		transform={`translate(${node.centerX}, ${node.centerY})`}
		clipPath="url(#fc-scene-clip)">
		<use href="#fc-scene-hidden" />
	</g>
)

const VisibleScene = ({ node, onClick }: SceneProps) => {
	const { isOpen, setIsOpen, refs, floatingStyles, getReferenceProps } = useScenePopover()

	const onAction = (e: React.MouseEvent | React.KeyboardEvent) => {
		if ('key' in e && (e.key !== "Enter" || e.currentTarget !== e.target)) {
			return
		}
		e.stopPropagation()
		setIsOpen(false)
		onClick?.(node.id as TsukihimeSceneName)
	}

	const disabled = node.state === FcNodeState.DISABLED
	const classes = classNames("fc-scene", "unlocked", {
		"blur": node.graph?.bg && cg.shouldBlur(node.graph.bg),
		"active": node.active,
		"disabled": disabled
	})

	return <>
		<g className={classes} id={`fc-scene-${node.id}`}
			transform={`translate(${node.centerX},${node.centerY})`}>
			<g className={'fc-scene-content'}
				tabIndex={disabled ? -1 : 0}
				clipPath="url(#fc-scene-clip)"
				onClick={!disabled ? onAction : undefined}
				onKeyDown={!disabled ? onAction : undefined}
				{...getReferenceProps()}
				onContextMenu={e => {
					e.preventDefault()
					setIsOpen(prev => !prev)
				}}
				ref={refs.setReference}
			>
				<SceneImage node={node} />
			</g>
		</g>

		{isOpen && createPortal(
			<div
				className="scene-popover-container"
				ref={refs.setFloating}
				style={floatingStyles}
				id="scene-popover">
				<m.div
					className="scene-popover"
					initial={{opacity: 0, scale: 0.9, transform: "translateY(-4px)"}}
					animate={{opacity: 1, scale: 1, transform: "translateY(0)"}}
					exit={{opacity: 0, scale: 0.9, transform: "translateY(-4px)"}}
				>
					<ScenePopover node={node} />
				</m.div>
			</div>,
			getRootElement()
		)}
	</>
}

export const SceneRenderer = ({ node, onClick }: SceneProps) => {

	switch (node.state) {
		case FcNodeState.HIDDEN:
			return null
		case FcNodeState.UNSEEN:
			return <UnseenScene node={node} />
		default:
			return <VisibleScene node={node} onClick={onClick} />
	}
}
