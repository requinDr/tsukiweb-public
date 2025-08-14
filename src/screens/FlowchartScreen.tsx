import '@styles/flowchart.scss'
import { SCREEN } from "../utils/display"
import Flowchart from "components/flowchart/Flowchart"
import { TsukihimeSceneName } from 'types'
import { playScene } from 'utils/savestates'
import { useScreenAutoNavigate, useLanguageRefresh } from 'hooks'

const FlowchartScreen = () => {
	useScreenAutoNavigate(SCREEN.SCENES)
	useLanguageRefresh()

	const onSceneClick = (id: TsukihimeSceneName)=> {
		playScene(id, {continueScript: false, viewedOnly: true})
	}
	return (
		<div className="page" id="scenes">
			<div className="page">
				<div className="page-content flowchart">
					<Flowchart onSceneClick={onSceneClick} />
				</div>
			</div>
		</div>
	)
}

export default FlowchartScreen