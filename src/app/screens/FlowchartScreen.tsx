import '@features/flowchart/styles/flowchart.scss'
import Flowchart from "features/flowchart/components/Flowchart"
import { SceneName } from 'app/utils/types'
import { playScene } from 'engine/savestates'
import { useCallback } from 'react'
import { SCREEN } from 'app/utils/display';
import { useScreenAutoNavigate } from 'app/hooks';

const FlowchartScreen = () => {
	useScreenAutoNavigate(SCREEN.SCENES)

	const onSceneClick = useCallback((id: SceneName)=> {
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