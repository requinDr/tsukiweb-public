import { useEffect, useRef, useState } from "react"
import { displayMode } from "../utils/display"
import { removeSkipHandlers, setSkipHandlers } from "../utils/script"
import { strings } from "../translation/lang"
import { useObserver } from "@tsukiweb-common/utils/Observer"
import classNames from "classnames"
import { bb, noBb } from "@tsukiweb-common/utils/Bbcode"
import GraphicsGroup from "components/molecules/GraphicsGroup"
import sceneAttrs from '../assets/game/scene_attrs.json'
import { TsukihimeSceneName } from "types"
import Button from "@tsukiweb-common/ui-core/components/Button"
import { getSceneTitle } from "utils/scriptUtils"
import * as motion from "motion/react-m"

const SkipLayer = () => {
	const [display, setDisplay] = useState<boolean>(false)
	const [scene, setScene] = useState<TsukihimeSceneName>()
	const [sceneTitle, setSceneTitle] = useState<string>()
	const skipConfirm = useRef<((skip:boolean)=>void)|undefined>(undefined)

	useEffect(()=> {
		setSkipHandlers((scene: TsukihimeSceneName, confirm: (skip: boolean)=>void)=> {
			displayMode.skip = true
			skipConfirm.current = confirm
			setScene(scene)
			setSceneTitle(getSceneTitle(scene))
		}, ()=> {
			displayMode.skip = false
			skipConfirm.current = undefined
		})
		return removeSkipHandlers
	}, [])
	
	useObserver(()=> {
		if (displayMode.skip && skipConfirm.current == undefined)
			displayMode.skip = false
		else setDisplay(displayMode.skip)
	}, displayMode, 'skip')

	function onSelection(skip: boolean) {
		displayMode.skip = false
		skipConfirm.current?.(skip)
		skipConfirm.current = undefined
	}

	const handleYes = onSelection.bind(null, true)
	const handleNo = onSelection.bind(null, false)

	const getThumbnail = (scene: TsukihimeSceneName) => {
		const scenes = sceneAttrs.scenes as Record<TsukihimeSceneName, any>;
		const attrs = scenes[scene]
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
				<div className="title">
					{sceneTitle ?<>
						{bb(strings.game["skip-named"][0])}
					</> : <>
						{bb(strings.game["skip-unnamed"])}
					</>}
				</div>
				
				{sceneTitle &&
				<div className="scene">
					<div className="scene-title">{noBb(sceneTitle)}</div> 
					<div className="thumbnail">
						<GraphicsGroup
							images={getThumbnail(scene as TsukihimeSceneName)}
							resolution="thumb"
						/>
					</div>
				</div>
				}

				<div>
					{bb(strings.game["skip-named"][1])} 
				</div>

				<div className="buttons">
					<Button onClick={handleYes}>{strings.yes}</Button>
					<Button onClick={handleNo}>{strings.no}</Button>
				</div>
			</motion.div>
		</div>
	)
}

export default SkipLayer