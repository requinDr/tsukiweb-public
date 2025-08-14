
import { useState } from "react"
import { FcNode, FcNodeState } from "utils/flowchart"
import { TsukihimeSceneName } from "types"
import { autoUpdate, useFloating, useHover, useInteractions } from "@floating-ui/react"
import { createPortal } from "react-dom"
import * as motion from "motion/react-m"
import cg from "utils/gallery"
import SceneImage from "./SceneImage"
import ScenePopover from "./ScenePopover"
import classNames from "classnames"

const useScenePopover = () => {
	const [isOpen, setIsOpen] = useState(false)
	const { refs, floatingStyles, context } = useFloating({
		placement: "right",
		whileElementsMounted: autoUpdate,
		open: isOpen,
		onOpenChange: setIsOpen
	})
	const hover = useHover(context, {
		delay: {
			open: 200,
			close: 50,
		},
	})
	const { getReferenceProps } = useInteractions([hover])

	return { isOpen, setIsOpen, refs, floatingStyles, context, getReferenceProps }
}

type SceneProps = {
	node: FcNode,
	onClick?: (id: TsukihimeSceneName) => void
}

const HiddenScene = () => <></>

const UnseenScene = ({ node }: { node: FcNode }) => (
	<g className='fc-scene' id={node.id}
		transform={`translate(${node.centerX}, ${node.centerY})`}>
		<g className="fc-scene-content"
			clipPath="url(#fc-scene-clip)">
			<use href="#fc-scene-hidden" />
		</g>
	</g>
)

const VisibleScene = ({ node, onClick }: SceneProps) => {
	const { isOpen, setIsOpen, refs, floatingStyles, getReferenceProps } = useScenePopover()

	const onAction = (e: React.MouseEvent | React.KeyboardEvent) => {
		if (e instanceof KeyboardEvent) {
			if (e.key !== "Enter" || e.currentTarget !== e.target)
				return
		}
		e.stopPropagation()
		setIsOpen(false)
		onClick?.(node.id as TsukihimeSceneName)
	}

	const classes = classNames("fc-scene", "unlocked", {
		"blur": node.graph?.bg && cg.shouldBlur(cg.getNameFromPath(node.graph.bg)),
		"active": node.active,
		"disabled": node.state === FcNodeState.DISABLED
	})

	return <>
		<g className={classes} id={`fc-scene-${node.id}`}
			transform={`translate(${node.centerX},${node.centerY})`}>
			<g className={'fc-scene-content'}
				tabIndex={0}
				clipPath="url(#fc-scene-clip)"
				onClick={node.state !== FcNodeState.DISABLED ? onAction : undefined}
				onKeyDown={node.state !== FcNodeState.DISABLED ? onAction : undefined}
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
				<motion.div
					className="scene-popover"
					initial={{opacity: 0, scale: 0.95}}
					animate={{opacity: 1, scale: 1}}>
					<ScenePopover node={node} onClose={() => setIsOpen(false)} />
				</motion.div>
			</div>,
			document.getElementById("root") as HTMLElement
		)}
	</>
}

export const SceneRenderer = ({ node, onClick }: SceneProps) => {

	switch (node.state) {
		case FcNodeState.HIDDEN:
			return <HiddenScene />
		case FcNodeState.UNSEEN:
			return <UnseenScene node={node} />
		default:
			return <VisibleScene node={node} onClick={onClick} />
	}
}
