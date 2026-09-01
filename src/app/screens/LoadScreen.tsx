import * as m from "motion/react-m"
import '@features/save/styles/saves.scss'
import SavesView from "features/save/components/SavesView";
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
		<m.main
			className="page" id="saves"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<SavesView variant="load" onBack={handleBack}/>
		</m.main>
	)
}

export default LoadScreen