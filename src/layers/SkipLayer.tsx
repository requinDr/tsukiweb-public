import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { strings } from "../translation/lang"
import { bb, noBb } from "@tsukiweb-common/utils/Bbcode"
import sceneAttrs from '@assets/game/scene_attrs.json'
import { LabelName, TsukihimeSceneName } from "types"
import { Button } from "@tsukiweb-common/ui-core"
import { getSceneTitle, isThScene } from "script/utils"
import * as m from "motion/react-m"
import { ScriptPlayer } from "script/ScriptPlayer"
import { settings, viewedScene } from "utils/settings"
import { History } from "script/history"
import cg from "utils/gallery"
import { audio } from "utils/audio"
import { InGameLayersHandler } from "utils/display"
import { Graphics } from "@tsukiweb-common/types"
import AnimatedHideActivityDiv from "@tsukiweb-common/ui-core/components/AnimatedHideActivityDiv"
import GraphicsGroup from "@tsukiweb-common/graphics/GraphicsGroup"

function getThumbnail(label: TsukihimeSceneName): Partial<Graphics> & {bg: Graphics["bg"]} {
	const scenes = sceneAttrs.scenes as Record<TsukihimeSceneName, any>
	const attrs = scenes[label]
	if (attrs) {
		if (attrs.osiete) {
			return {"bg": "bg/bg_06a", "r": "tachi/cel_t20"}
		}
		const graph = attrs.fc?.graph
		if (graph) {
			return graph
		}
	}
	return {"bg": "#000000"}
}

type Props = {
	script: ScriptPlayer
	history: History
	layers: InGameLayersHandler
}

const SkipLayer = ({script, history, layers}: Props) => {
	const [scene, setScene] = useState<TsukihimeSceneName|undefined>(undefined)
	const onFinish = useRef<VoidFunction>(undefined)

	useEffect(()=> {
		const ref = script.addEventListener('beforeBlock',
			(label, initPage)=> {
				if (isThScene(label) && initPage === 0 && settings.enableSceneSkip && viewedScene(label)) {
					return new Promise<void>((resolve)=> {
						setScene(label)
						onFinish.current = resolve
					})
			}
		})

		return () => {
			script.removeEventListener('beforeBlock', ref)
		}
	}, [script])
	
	const onClick = useCallback((e: React.MouseEvent<HTMLButtonElement>)=> {
		if (e.currentTarget.value === 'yes' && script.currentLabel) {
			script.skipCurrentBlock()
			history.onSceneSkip(script.currentLabel)
		}
		onFinish.current?.()
		setScene(undefined)
	}, [script, history])

	let display = layers.text && scene !== undefined
	const sceneTitle = display ? getSceneTitle(Array.from(script.flags), scene!) : ""
	const btnProps = useMemo(()=> ({
		onClick: onClick,
		audio: audio,
		hoverSound:'tick'
	}), [onClick])

	// prevent navigation on skip buttons when other layer is active
	const nav = display && (layers.topLayer == 'text')
	
	return (
		<AnimatedHideActivityDiv
			show={display}
			showProps={{className: "show"}}
			id="skip-layer"
			className="layer"
		>
			<m.div
				className="skip-modal"
				initial={{opacity: 0, scale: 0.9}}
				animate={{opacity: 1, scale: 1}}
				transition={{ ease: "easeOut", duration: 0.2 }}
				key={scene}
			>				
				{sceneTitle && scene &&
					<SceneImage scene={scene} sceneTitle={sceneTitle} />
				}

				<div className="body">
					<div className="title">
						{bb(strings.game["skip-viewed"])}
					</div>
					<div className="desc">
						{bb(strings.game["skip-prompt"])}
					</div>
				</div>

				<div className="buttons">
					<Button {...btnProps} value="yes" clickSound="glass"
							{...(nav && {'nav-x': -1})}>
						{strings.yes}
					</Button>
					<Button {...btnProps} value="no" clickSound="close"
							{...(nav && {'nav-x': 1})}>
						{strings.no}
					</Button>
				</div>
			</m.div>
		</AnimatedHideActivityDiv>
	)
}

export default SkipLayer


const SceneImage = ({ scene, sceneTitle }: { scene: TsukihimeSceneName, sceneTitle: string }) => {
	const image = getThumbnail(scene)
	const isCGScene = cg.isInGallery(image?.bg)

	return (
		<div className="scene">
			<div className="thumbnail">
				<GraphicsGroup
					images={image}
					resolution={isCGScene ? "src" : "thumb"}
				/>
			</div>
			<div className="scene-title">{noBb(sceneTitle)}</div> 
		</div>
	)
}