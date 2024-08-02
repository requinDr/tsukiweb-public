import GraphicsGroup from "components/molecules/GraphicsGroup"
import { Fragment } from "react/jsx-runtime"
import { SceneName, LabelName } from "types"
import { SCENE_HEIGHT, SCENE_WIDTH } from "utils/flowchart"
import { playScene } from "utils/savestates"
import { settings } from "utils/settings"
import { FcNode } from "./FcNode"
import { Graphics } from "@tsukiweb-common/types"
import classNames from "classnames"
import { imageNameFromPath, shouldBlur } from "utils/gallery"

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
			content = <>
				<foreignObject
					x={-SCENE_WIDTH/2} y={-SCENE_HEIGHT/2}
					width={SCENE_WIDTH} height={SCENE_HEIGHT}
				>
					<div style={{position: "fixed", width: "100%", height: "100%"}}>
						<GraphicsGroup images={this.graph} resolution="thumb" lazy={true} />
					</div>
				</foreignObject>
				<use href="#fc-scene-outline"/>
			</>
		}

		const play = (e: React.MouseEvent | React.KeyboardEvent) => {
			if (completed)
				playScene(this.id as LabelName, { continueScript: false })
			else
				e.stopPropagation()
		}

		const blur = completed && settings.blurThumbnails && this.graph?.bg && shouldBlur(imageNameFromPath(this.graph?.bg))

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