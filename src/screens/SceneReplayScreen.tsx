import { useScreenAutoNavigate } from "hooks"
import { useEffect } from "react"
import { useParams } from "react-router"
import { LabelName } from "types"
import { SCREEN } from "utils/display"
import { playScene } from "utils/savestates"

const SceneReplayScreen = () => {
	useScreenAutoNavigate(SCREEN.SCENES)
	const { sceneId } = useParams()

	useEffect(() => {
		startSceneReplay()
	}, [sceneId])

	const startSceneReplay = () => {
		const sceneIdTmp = sceneId as LabelName
		window.history.replaceState(null, '', '/scenes')
		playScene(sceneIdTmp, { continueScript: false, viewedOnly: false })
	}

	return null
}

export default SceneReplayScreen