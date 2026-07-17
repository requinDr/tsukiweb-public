import * as m from "motion/react-m"
import '@features/save/styles/saves.scss'
import SavesLayout from "features/save/components/SavesLayout";
import { useScreenAutoNavigate } from "app/hooks";
import { SCREEN, displayMode } from "app/utils/display";
import { useDefaultNavBack } from "@tsukiweb/common/hooks";

function handleBack(saveLoaded: boolean) {
	if (!saveLoaded)
		displayMode.screen = SCREEN.TITLE
}

const LoadScreen = () => {
	useScreenAutoNavigate(SCREEN.LOAD)
	useDefaultNavBack(handleBack.bind(null, false))
	
	return (
		<m.div
			className="page" id="saves"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<div className="page-content">
				<SavesLayout variant="load" onBack={handleBack}/>
			</div>
		</m.div>
	)
}

export default LoadScreen