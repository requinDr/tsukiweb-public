
import { SyntheticEvent, useEffect, useRef, useState } from "react"
import { FcNode, FcNodeState, SCENE_HEIGHT, SCENE_WIDTH } from "utils/flowchart"
import { TsukihimeSceneName } from "types"
import { imageNameFromPath, shouldBlur } from "utils/gallery"
import { autoUpdate, useFloating, useHover, useInteractions } from "@floating-ui/react"
import { createPortal } from "react-dom"
import GraphicsGroup from "components/molecules/GraphicsGroup"
import * as motion from "motion/react-m"

//##############################################################################
//#region                       HELPER FUNCTIONS
//##############################################################################

function onImgLoad(top: number, left: number, width: number, height: number,
				   evt: SyntheticEvent<HTMLImageElement, Event>) {
	const img = evt.target as HTMLImageElement
	const imgWidth = img.naturalWidth
	const imgHeight = img.naturalHeight
	const ratio_x = SCENE_WIDTH / width
	const ratio_y = SCENE_HEIGHT / height
	img.style.marginLeft = `-${ratio_x * left}px`,
	img.style.marginTop  = `-${ratio_y * top}px`
	img.style.width      = `${imgWidth * ratio_x}px`
	img.style.height     = `${imgHeight * ratio_y}px`
}

//#endregion ###################################################################
//#region                        SUB COMPONENTS
//##############################################################################

type ImageProps = React.HTMLAttributes<HTMLImageElement>
export function SceneImage(node: FcNode, props: ImageProps = {}) {
	const {file, left, top, width, height} = node.metadatas
	if (file) {
		return (<>
			<foreignObject
				x={-SCENE_WIDTH/2} y={-SCENE_HEIGHT/2}
				width={SCENE_WIDTH} height={SCENE_HEIGHT}
			>
				<img
					onLoad={onImgLoad.bind(null, top, left, width, height)}
					src={file}
					alt={`Thumbnail for ${node.id}`}
					{...props}
				/>
			</foreignObject>
			<use href="#fc-scene-outline"/>
		</>)
	} else {
		return <>
			<use href="#fc-scene-background" />
			<text className="fc-scene-title">{node.id}</text>
			<use href="#fc-scene-outline"/>
		</>
	}
}
//##############################################################################
//#region                             SCENE
//##############################################################################

type SceneProps = { node: FcNode, onClick?: (id: TsukihimeSceneName)=>void }
export function SceneRenderer({node, onClick}: SceneProps) {

// ----- non-displayed node -----
	if (node.state == FcNodeState.HIDDEN)
		return <></>
	if (node.state == FcNodeState.UNSEEN) {
		return <g className='fc-scene' id={node.id}
				transform={`translate(${node.centerX}, ${node.centerY})`}>
				<g className="fc-scene-content"
					clipPath="url(#fc-scene-clip)">
					<use href="#fc-scene-hidden"/>
				</g>
			</g>
	}

// ----- state-specific changes -----
	const classes = ["fc-scene", "unlocked"]
	if (node.graph?.bg && shouldBlur(imageNameFromPath(node.graph.bg)))
		classes.push("blur")
	switch (node.state) {
		case FcNodeState.DISABLED :
			classes.push("disabled")
			onClick = undefined
			break
		case FcNodeState.ENABLED : break
		case FcNodeState.ACTIVE :
			classes.push("active")
			break;
		default :
			let unknown: never = node.state
			throw Error(`unknown node state ${unknown}`)
	}
	
// ----- floating panel -----
	const [isOpen, setIsOpen] = useState(false)
	const {refs, floatingStyles, context} = useFloating({
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
	const {getReferenceProps} = useInteractions([ hover ])

// ----- on click event -----
	const onAction = (e: React.MouseEvent | React.KeyboardEvent) => {
		if (e instanceof KeyboardEvent) {
			if (e.key !== "Enter" || e.currentTarget !== e.target)
				return
		}
		e.stopPropagation()
		setIsOpen(false)
		onClick?.(node.id as TsukihimeSceneName)
	}
// ----- render -----
	return <>
		<g className={classes.join(' ')} id={`fc-scene-${node.id}`}
			transform={`translate(${node.centerX},${node.centerY})`}>
			<g className={'fc-scene-content'}
				tabIndex={0}
				clipPath="url(#fc-scene-clip)"
				onClick={onAction} onKeyDown={onAction}
				{...getReferenceProps()}
				onContextMenu={(e) => {
					e.preventDefault()
					setIsOpen(!isOpen)
				}}
				ref={refs.setReference}
			>
				{SceneImage(node)}
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

//#endregion ###################################################################
//#region                          SCENE POPUP
//##############################################################################

type PopoverProps = { node: FcNode, onClose: () => void }
const ScenePopover = ({ node, onClose }: PopoverProps) => {
	const popoverRef = useRef<HTMLDivElement>(null)
	
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
				onClose()
			}
		}
		
		document.addEventListener('mousedown', handleClickOutside)
		
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [onClose])

	return (
		<div className="scene-popover-content" ref={popoverRef}>
			<div className="header">
				<GraphicsGroup images={node.graph ?? {bg:"#000"}} resolution="sd" />
			</div>
			<div className="content">
				{node.id}<br/>
			</div>
		</div>
	)
}