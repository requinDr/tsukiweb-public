import { Fragment, ReactNode, SyntheticEvent, useEffect, useRef, useState } from "react"
import { TsukihimeSceneName, LabelName } from "types"
import { SCENE_HEIGHT, SCENE_WIDTH } from "utils/flowchart"
import { playScene, viewedScene } from "utils/savestates"
import { settings } from "utils/settings"
import { FcNode } from "./FcNode"
import { Graphics } from "@tsukiweb-common/types"
import classNames from "classnames"
import { imageNameFromPath, shouldBlur } from "utils/gallery"
import SpritesheetMetadata from "../../assets/flowchart/spritesheet_metadata.json"
import { spriteSheetImgPath } from "translation/assets"
import GraphicsGroup from "components/molecules/GraphicsGroup"
import * as motion from "motion/react-m"
import { autoUpdate, useFloating, useHover, useInteractions} from '@floating-ui/react';
import { createPortal } from "react-dom"

type SpritesheetMetadata = {
	d: {
		w: number
		h: number
	}
	f: string[] // file names
	i: {
		[key: string]: number[] // [top, left, file index]
	}
}
const metadatas: SpritesheetMetadata = JSON.parse(JSON.stringify(SpritesheetMetadata))

function onLoad(top: number, left: number, width: number, height: number, evt: SyntheticEvent<HTMLImageElement, Event>) {
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

const FlowchartScene = (id: string) => {
	const [top, left, index] = metadatas.i[id]
	const { w: width, h: height } = metadatas.d

	const image = spriteSheetImgPath(metadatas.f[index])
	
	return (<>
		<foreignObject
			x={-SCENE_WIDTH/2} y={-SCENE_HEIGHT/2}
			width={SCENE_WIDTH} height={SCENE_HEIGHT}
		>
			<img
				onLoad={onLoad.bind(null, top, left, width, height)}
				src={image}
				alt={`Thumbnail for ${id}`}
			/>
		</foreignObject>
		<use href="#fc-scene-outline"/>
	</>)
}

export class FcScene extends FcNode {
	graph: Graphics|undefined
	constructor(id: TsukihimeSceneName, column: number, from: FcNode[], alignedNode?: FcNode, graph?: Graphics, cutAt?: number) {
		super(id, column, from, alignedNode, cutAt)
		this.y += SCENE_HEIGHT/2
		this.graph = graph
	}

	get width()   { return SCENE_WIDTH }
	get height()  { return SCENE_HEIGHT }

	render() {
		let content
		let completed = viewedScene(this.id as LabelName) || settings.unlockEverything
		if (!completed && !settings.unlockEverything)
			content = <use href="#fc-scene-hidden"/>
		else if (!this.graph)
			content = <>
				<use href="#fc-scene-background" />
				<text className="fc-scene-title">{this.id}</text>
				<use href="#fc-scene-outline"/>
			</>
		else {
			content = FlowchartScene(this.id as string)
		}

		const blur = Boolean(completed && this.graph?.bg && shouldBlur(imageNameFromPath(this.graph?.bg)))

		return (
			<Fragment key={this.id}>
				{super.render()}
				
				{completed ?
					<UnlockedSceneRender
						id={this.id}
						graphics={this.graph}
						content={content}
						blur={blur}
						x={this.x} y={this.y}
					/>
				:
					<g 
						className={`fc-scene`} 
						id={this.id}
						transform={`translate(${this.x},${this.y})`}
					>
						<g
							className={classNames("fc-scene-content", {unlocked: completed, blur})}
							clipPath="url(#fc-scene-clip)"
						>
							{content}
						</g>
					</g>
				}
			</Fragment>
		)
	}
}



type SceneRenderProps = {
	id: string
	graphics?: Graphics
	content: ReactNode
	blur: boolean
	x: number
	y: number
}
export const UnlockedSceneRender = ({ id, graphics, content, blur, x, y }: SceneRenderProps) => {
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

	const {getReferenceProps} = useInteractions([
    hover,
  ])

	const play = (e: React.MouseEvent | React.KeyboardEvent) => {
		e.stopPropagation()
		setIsOpen(false)
		playScene(id as LabelName, { continueScript: false })
	}

	return (
		<>
			<g 
				className={`fc-scene`} 
				id={`fc-scene-${id}`}
				transform={`translate(${x},${y})`}
			>
				<g
					className={classNames("fc-scene-content", "unlocked", {blur})}
					tabIndex={0}
					clipPath="url(#fc-scene-clip)"
					onClick={play}
					onKeyDown={(e) => {
							if (e.key === "Enter" && e.currentTarget === e.target) {
								play(e)
							}
						}
					}
					{...getReferenceProps()}
					onContextMenu={(e) => {
						e.preventDefault()
						setIsOpen(!isOpen)
					}}
					ref={refs.setReference}
				>
					{content}
				</g>
			</g>
			
			{isOpen && createPortal(
				<div
					className="scene-popover-container"
					ref={refs.setFloating}
					style={floatingStyles}
					id="scene-popover"
				>
					<motion.div
						className="scene-popover"
						initial={{opacity: 0, scale: 0.95}}
						animate={{opacity: 1, scale: 1}}
					>
						<ScenePopover id={id} graphics={graphics} onClose={() => setIsOpen(false)} />
					</motion.div>
				</div>,
				document.getElementById("root-view") as HTMLElement
			)}
		</>
	)
}

const ScenePopover = ({ id, graphics, onClose }: { id: string, graphics?: Graphics, onClose: () => void }) => {
	const popoverRef = useRef<HTMLDivElement>(null)
	
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
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
				<GraphicsGroup images={graphics ?? {bg:"#000"}} resolution="sd" />
			</div>
			<div className="content">
				{id}<br/>
			</div>
		</div>
	)
}