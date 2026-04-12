import { useScreenAutoNavigate } from "hooks"
import { useEffect } from "react"
import { useParams } from "wouter"
import { LabelName } from "types"
import { displayMode, SCREEN } from "utils/display"
import { playScene } from "utils/savestates"

const SceneReplayScreen = () => {
	useScreenAutoNavigate(SCREEN.SCENES)
	const {sceneId} = useParams<{ sceneId: string }>()

	useEffect(() => {
		startSceneReplay()
	}, [sceneId])

	const startSceneReplay = () => {
		const sceneIdTmp = sceneId as LabelName
		displayMode.replaceNavigation = true
		playScene(sceneIdTmp, { continueScript: false, viewedOnly: false })
	}

	return null
}

export default SceneReplayScreen