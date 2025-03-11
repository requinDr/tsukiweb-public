import * as motion from "motion/react-m"
import '../styles/saves.scss'
import SavesLayout from "../components/SavesLayout"
import { SCREEN, displayMode } from "../utils/display"
import { useLanguageRefresh } from "../components/hooks/useLanguageRefresh"
import { useScreenAutoNavigate } from "../components/hooks/useScreenAutoNavigate"

const LoadScreen = () => {
	useScreenAutoNavigate(SCREEN.LOAD)
	useLanguageRefresh()

	function back(saveLoaded: boolean) {
		if (!saveLoaded)
			displayMode.screen = SCREEN.TITLE
	}
	return (
		<motion.div
			className="page" id="saves"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<div className="page-content">
				<SavesLayout variant="load" back={back}/>
			</div>
		</motion.div>
	)
}

export default LoadScreen