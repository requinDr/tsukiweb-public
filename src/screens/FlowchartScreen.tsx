import '../styles/flowchart.scss'
import { SCREEN, displayMode } from "../utils/display"
import { useLanguageRefresh } from "../components/hooks/useLanguageRefresh"
import { useScreenAutoNavigate } from "../components/hooks/useScreenAutoNavigate"
import Flowchart from "components/flowchart/Flowchart"

const FlowchartScreen = () => {
	useScreenAutoNavigate(SCREEN.SCENES)
	useLanguageRefresh()

	function back(sceneLoaded: boolean) {
		if (!sceneLoaded)
			displayMode.screen = SCREEN.TITLE
	}
	return (
		<div
			className="page" id="scenes">
			<div className="page">
				<Flowchart back={back} />
			</div>
		</div>
	)
}

export default FlowchartScreen