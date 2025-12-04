import { useCallback, useEffect, useRef, useState } from "react"
import { strings } from "../translation/lang"
import classNames from "classnames"
import { bb, noBb } from "@tsukiweb-common/utils/Bbcode"
import GraphicsGroup from "components/molecules/GraphicsGroup"
import sceneAttrs from '@assets/game/scene_attrs.json'
import { TsukihimeSceneName } from "types"
import { Button } from "@tsukiweb-common/ui-core"
import { getSceneTitle, isThScene } from "script/utils"
import * as m from "motion/react-m"
import { ScriptPlayer } from "script/ScriptPlayer"
import { settings } from "utils/settings"
import { History } from "utils/history"
import cg from "utils/gallery"
import { audio } from "utils/audio"
import { InGameLayersHandler } from "utils/display"
import { Graphics } from "@tsukiweb-common/types"

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
		script.setBeforeBlockCallback((label, initPage)=> {
			if (isThScene(label) && initPage == 0 && settings.completedScenes.includes(label)) {
				return new Promise<void>((resolve)=> {
					setScene(label)
					onFinish.current = resolve
				})
			}
		})
		return ()=> {
			script.setBeforeBlockCallback(undefined)
		}
	}, [script])
	
	const onClick = useCallback((e: React.MouseEvent<HTMLButtonElement>)=> {
		if (e.currentTarget.value == 'yes' && script.currentLabel) {
			script.skipCurrentBlock()
			history.onSceneSkip(script, script.currentLabel)
		}
		onFinish.current?.()
		setScene(undefined)
	}, [script])

	let display = layers.text && (scene != undefined)
	const sceneTitle = display ? getSceneTitle(Array.from(script.flags), scene!) : ""
	const btnProps = {
		onClick: onClick,
		audio: audio,
		hoverSound:'tick'
	}
	// prevent navigation on skip buttons when other layer is active
	const nav = display && (layers.topLayer == 'text')
	
	return (
		<div
			id="skip-layer"
			className={classNames("layer", {show: display})}
		>
			<m.div
				className="skip-modal"
				initial={{opacity: 0, scale: 0.9}}
				animate={{opacity: 1, scale: 1}}
				key={sceneTitle}
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
					<Button {...btnProps} value="no" clickSound="impact"
							{...(nav && {'nav-x': 1})}>
						{strings.no}
					</Button>
				</div>
			</m.div>
		</div>
	)
}

export default SkipLayer


const SceneImage = ({ scene, sceneTitle }: { scene: TsukihimeSceneName, sceneTitle: string }) => {
	const image = getThumbnail(scene)
	const isCGScene = scene ? cg.isInGallery(image?.bg) : false

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