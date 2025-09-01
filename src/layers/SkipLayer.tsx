import { MouseEvent, useCallback, useEffect, useRef, useState } from "react"
import { strings } from "../translation/lang"
import classNames from "classnames"
import { bb, noBb } from "@tsukiweb-common/utils/Bbcode"
import GraphicsGroup from "components/molecules/GraphicsGroup"
import sceneAttrs from '../assets/game/scene_attrs.json'
import { TsukihimeSceneName } from "types"
import { Button } from "@tsukiweb-common/ui-core"
import { getSceneTitle, isThScene } from "script/utils"
import * as motion from "motion/react-m"
import { ScriptPlayer } from "script/ScriptPlayer"
import { settings } from "utils/settings"
import { History } from "utils/history"

function getThumbnail(label: TsukihimeSceneName) {
	const scenes = sceneAttrs.scenes as Record<TsukihimeSceneName, any>;
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
	return {}
}

type Props = {
	script: ScriptPlayer
	display: boolean
	history: History
}

const SkipLayer = ({script, history, display}: Props) => {
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
	
	const onClick = useCallback((evt: MouseEvent<HTMLButtonElement>)=> {
		if ((evt.target as HTMLButtonElement).value == 'yes') {
			script.skipCurrentBlock()
			history.onSceneSkip(script, script.currentLabel!)
		}
		onFinish.current?.()
		setScene(undefined)
	}, [script])

	if (!scene)
		display = false
	const sceneTitle = display ? getSceneTitle(Array.from(script.flags), scene!) : ""
	
	return (
		<div
			id="skip-layer"
			className={classNames("layer", {show: display})}
		>
			<motion.div
				className="skip-modal"
				initial={{opacity: 0, scale: 0.9}}
				animate={{opacity: 1, scale: 1}}
				key={sceneTitle}
			>				
				{sceneTitle &&
				<div className="scene">
					<div className="thumbnail">
						<GraphicsGroup
							images={getThumbnail(scene as TsukihimeSceneName)}
							resolution="sd"
						/>
					</div>
					<div className="scene-title">{noBb(sceneTitle)}</div> 
				</div>
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
					<Button onClick={onClick} value="yes">{strings.yes}</Button>
					<Button onClick={onClick} value="no">{strings.no}</Button>
				</div>
			</motion.div>
		</div>
	)
}

export default SkipLayer