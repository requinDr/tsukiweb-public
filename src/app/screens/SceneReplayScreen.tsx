import { useEffect } from "react"
import { useParams } from "wouter"
import { LabelName } from "app/utils/types"
import { displayMode, SCREEN } from "app/utils/display"
import { playScene } from "engine/savestates"
import { useScreenAutoNavigate } from "app/hooks";

const SceneReplayScreen = () => {
	useScreenAutoNavigate(SCREEN.SCENES)
	const {sceneId} = useParams<{ sceneId: string }>()

	useEffect(() => {
		const sceneIdTmp = sceneId as LabelName
		displayMode.replaceNavigation = true
		displayMode.navigationState = { replayReturnTo: SCREEN.SCENES }
		playScene(sceneIdTmp, { continueScript: false, viewedOnly: false })
	}, [sceneId])

	return null
}

export default SceneReplayScreen