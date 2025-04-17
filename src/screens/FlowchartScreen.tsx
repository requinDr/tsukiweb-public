import '../styles/flowchart.scss'
import { SCREEN, displayMode } from "../utils/display"
import { useLanguageRefresh } from "../components/hooks/useLanguageRefresh"
import { useScreenAutoNavigate } from "../components/hooks/useScreenAutoNavigate"
import Flowchart from "components/flowchart/Flowchart"
import { TsukihimeSceneName } from 'types'
import { playScene } from 'utils/savestates'

const FlowchartScreen = () => {
	useScreenAutoNavigate(SCREEN.SCENES)
	useLanguageRefresh()

	const onSceneClick = (id: TsukihimeSceneName)=> {
		playScene(id, {continueScript: true, viewedOnly: true})
	}
	return (
		<div
			className="page" id="scenes">
			<div className="page">
				<div className="page-content flowchart">
					<Flowchart onSceneClick={onSceneClick} />
				</div>
			</div>
		</div>
	)
}

export default FlowchartScreen