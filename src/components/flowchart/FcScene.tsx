import { Fragment } from "react/jsx-runtime"
import { SceneName, LabelName } from "types"
import { SCENE_HEIGHT, SCENE_WIDTH } from "utils/flowchart"
import { playScene } from "utils/savestates"
import { settings } from "utils/settings"
import { FcNode } from "./FcNode"
import { Graphics, JSONObject } from "@tsukiweb-common/types"
import classNames from "classnames"
import { imageNameFromPath, shouldBlur } from "utils/gallery"
import { assetPath } from "translation/assets"
import SpritesheetMetadata from "../../assets/flowchart/spritesheet_metadata.json"
import { SyntheticEvent, useEffect, useState } from "react"
import { preloadImage } from "components/molecules/GraphicsGroup"

const metadatas = JSON.parse(JSON.stringify(SpritesheetMetadata))

const spriteSheetImgPath = (file: string) => {
	return assetPath(`jp/flowchart-spritesheet/${file}`)
}

function onLoad(metadata: JSONObject, evt: SyntheticEvent<HTMLImageElement, Event>) {
	const img = evt.target as HTMLImageElement
	const imgWidth = img.naturalWidth
	const imgHeight = img.naturalHeight
	const { top, left, width, height } = metadata as Record<string, number>
	const ratio_x = SCENE_WIDTH / width
	const ratio_y = SCENE_HEIGHT / height
	img.style.marginLeft = `-${ratio_x * left}px`,
	img.style.marginTop  = `-${ratio_y * top}px`
	img.style.width      = `${imgWidth * ratio_x}px`
	img.style.height     = `${imgHeight * ratio_y}px`
}

const FlowchartScene = (id: string) => {
	const imageMetadata = metadatas[id]

	const image = spriteSheetImgPath(imageMetadata.file)
	
	return (<>
		<foreignObject
			x={-SCENE_WIDTH/2} y={-SCENE_HEIGHT/2}
			width={SCENE_WIDTH} height={SCENE_HEIGHT}
		>
			<img
				src={image}
				alt={id}
				onLoad={onLoad.bind(null, imageMetadata)}
			/>
		</foreignObject>
		<use href="#fc-scene-outline"/>
	</>)
}

export class FcScene extends FcNode {
	graph: Graphics|undefined
	constructor(id: SceneName, column: number, from: FcNode[], alignedNode?: FcNode, graph ?: Graphics, cutAt?: number) {
		super(id, column, from, alignedNode, cutAt)
		this.y += SCENE_HEIGHT/2
		this.graph = graph
	}

	get width()   { return SCENE_WIDTH }
	get height()  { return SCENE_HEIGHT }

	render() {
		let content
		let completed = settings.completedScenes.includes(this.id) || settings.unlockEverything
		if (!completed && !settings.unlockEverything)
			content = <use href="#fc-scene-hidden"/>
		else if (!this.graph)
			content = <>
				<use href="#fc-scene-background" />
				<text className="fc-scene-title">{this.id}</text>
				<use href="#fc-scene-outline"/>
			</>
		else {
			// SpritesheetMetadata : {
			// 	"openning": {
			// 		"file": "spritesheet_0.webp",
			// 		"top": 0,
			// 		"left": 0,
			// 		"width": 108,
			// 		"height": 72
			// 	},

			//find the metadata for the scene and dynamically import the image
			// const metadatas = JSON.parse(JSON.stringify(SpritesheetMetadata))
			// const imageMetadata = metadatas[this.id]
			// const { top, left, width, height } = imageMetadata
			// const image = await import(`../../assets/flowchart/${imageMetadata.file}`)


			// content = <>
			// 	<foreignObject
			// 		x={-SCENE_WIDTH/2} y={-SCENE_HEIGHT/2}
			// 		width={SCENE_WIDTH} height={SCENE_HEIGHT}
			// 	>
			// 		<img src={assetPath(`jp/thumbnails/${this.id}_thumb.webp`)} alt={this.id} style={{width: "100%", height: "100%"}}/>
			// 	</foreignObject>
			// 	<use href="#fc-scene-outline"/>
			// </>
			content = FlowchartScene(this.id as string)
		}

		const play = (e: React.MouseEvent | React.KeyboardEvent) => {
			if (completed)
				playScene(this.id as LabelName, { continueScript: false })
			else
				e.stopPropagation()
		}

		const blur = completed && this.graph?.bg && shouldBlur(imageNameFromPath(this.graph?.bg))

		return (
			<Fragment key={this.id}>
				{super.render()}
				
				<g className={`fc-scene`} id={this.id}
					transform={`translate(${this.x},${this.y})`}
					// TODO: continueScript = true if using the flowchart to navigate to previous scene (not yet implemented)
				>
					<g
						className={classNames("fc-scene-content", {completed, blur})}
						tabIndex={completed ? 0 : -1}
						clipPath="url(#fc-scene-clip)"
						onClick={play}
						onKeyDown={(e) => {
								if (e.key === "Enter" && e.currentTarget === e.target) {
									play(e)
								}
							}
						}
					>
						<title>{this.id}</title>
						{content}
					</g>
				</g>
			</Fragment>
		)
	}
}