import '@styles/flowchart.scss'
import { SCREEN } from "../utils/display"
import Flowchart from "components/flowchart/Flowchart"
import { TsukihimeSceneName } from 'types'
import { playScene } from 'utils/savestates'
import { useScreenAutoNavigate } from 'hooks'
import { useCallback } from 'react'

const FlowchartScreen = () => {
	useScreenAutoNavigate(SCREEN.SCENES)

	const onSceneClick = useCallback((id: TsukihimeSceneName)=> {
		playScene(id, {continueScript: false, viewedOnly: true})
	}, [])

	return (
		<div className="page" id="flowchart">
			<div className="page-content flowchart-container">
				<Flowchart onSceneClick={onSceneClick} />
			</div>
		</div>
	)
}

export default FlowchartScreen