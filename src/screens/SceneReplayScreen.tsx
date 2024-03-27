import { useScreenAutoNavigate } from "components/hooks/useScreenAutoNavigate"
import { useEffect } from "react"
import { useParams } from "react-router-dom"
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

  return (
		<></>
	)
}

export default SceneReplayScreen