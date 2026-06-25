import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { noBb } from "@tsukiweb-common/utils/Bbcode"
import { SceneName } from "app/utils/types"
import { Button } from "@tsukiweb-common/ui-core"
import { getSceneTitle, isThScene } from "engine/utils"
import * as m from "motion/react-m"
import { ScriptPlayer } from "engine/ScriptPlayer"
import { settings, viewedScene } from "engine/settings"
import { History } from "engine/history"
import { audio } from "engine/audio"
import { InGameLayersHandler } from "@tsukiweb-common/utils/InGameLayersHandler"
import AnimatedHideActivityDiv from "@tsukiweb-common/ui-core/components/AnimatedHideActivityDiv"
import classNames from "classnames"
import { GraphicsGroup } from "@tsukiweb-common/graphics"
import { getSceneGraph } from "features/flowchart/utils/flowchart"
import cg from "features/gallery/utils/gallery"
import { strings } from "translation/lang"


type Props = {
	script: ScriptPlayer
	history: History
	layers: InGameLayersHandler
}

type SkipMode = 'viewed' | 'hscene'

const SkipLayer = ({script, history, layers}: Props) => {
	const [scene, setScene] = useState<SceneName|undefined>(undefined)
	const [mode, setMode] = useState<SkipMode>('viewed')
	const onFinish = useRef<((skipped: boolean)=>void)>(undefined)

	useEffect(()=> {
		const ref = script.addEventListener('beforeBlock',
			async (label, initPage)=> {
				if (initPage !== 0 || !isThScene(label) || !script.continueScript) return

				if (settings.enableSceneSkip && viewedScene(label)) {
					await new Promise<boolean>((resolve)=> {
						setMode('viewed')
						setScene(label)
						onFinish.current = resolve
					})
				}
		})

		return () => {
			script.removeEventListener('beforeBlock', ref)
		}
	}, [script])

	useEffect(()=> {
		script.onEroSkipPrompt = (nbPages: number) => {
			return new Promise<boolean>((resolve)=> {
				setMode('hscene')
				setScene(script.currentLabel as SceneName)
				onFinish.current = resolve
			})
		}

		return () => {
			script.onEroSkipPrompt = undefined
		}
	}, [script])
	
	const onClick = useCallback((e: React.MouseEvent<HTMLButtonElement>)=> {
		const skipped = e.currentTarget.value === 'yes'
		if (skipped && mode === 'viewed' && script.currentLabel) {
			script.skipCurrentBlock()
			history.onSceneSkip(script.currentLabel)
		}
		onFinish.current?.(skipped)
		setScene(undefined)
	}, [script, history, mode])

	const btnProps = useMemo(()=> ({
		onClick: onClick,
		audio: audio,
		hoverSound:'tick'
	}), [onClick])

	const display = layers.text && scene !== undefined
	const sceneTitle = display ? getSceneTitle(Array.from(script.flags), scene!) : undefined

	// prevent navigation on skip buttons when other layer is active
	const nav = display && (layers.topLayer == 'text')
	const isHSceneMode = mode === 'hscene'
	
	return (
		<AnimatedHideActivityDiv
			show={display}
			showProps={{className: "show"}}
			id="skip-layer"
			className="layer"
		>
			<m.div
				className={classNames("skip-modal", {"h-scene-modal": isHSceneMode})}
				initial={{opacity: 0, scale: 0.9}}
				animate={{opacity: 1, scale: 1}}
				transition={{ ease: "easeOut", duration: 0.2 }}
				key={scene}
			>	
				{!isHSceneMode && sceneTitle && scene &&
					<SceneImage scene={scene} sceneTitle={sceneTitle} />
				}

				<div className="body">
					<div className="title">
						{isHSceneMode
							? strings.game["skip-hcontent"]
							: strings.game["skip-viewed"]
						}
					</div>
					<div className="desc">
						{strings.game["skip-prompt"]}
					</div>
				</div>

				<div className="buttons">
					<Button {...btnProps} value="yes" clickSound="glass" nav-x={nav ? -1 : undefined}>
						{strings.yes}
					</Button>
					<Button {...btnProps} value="no" clickSound="close" nav-x={nav ? 1 : undefined}>
						{strings.no}
					</Button>
				</div>
			</m.div>
		</AnimatedHideActivityDiv>
	)
}

export default SkipLayer


const SceneImage = ({ scene, sceneTitle }: { scene: SceneName, sceneTitle: string }) => {
	const image = getSceneGraph(scene)
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