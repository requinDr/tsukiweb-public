import * as motion from "motion/react-m"
import '@styles/saves.scss'
import SavesLayout from "../components/save/SavesLayout"
import { SCREEN, displayMode } from "../utils/display"
import { useEffect } from "react"
import { useScreenAutoNavigate, useLanguageRefresh } from "hooks"
import { sysAudio } from "utils/audio"
import { SYS_SE } from "utils/constants"


const LoadScreen = () => {
	useScreenAutoNavigate(SCREEN.LOAD)
	useLanguageRefresh()

	function back(saveLoaded: boolean) {
		if (!saveLoaded) {
			sysAudio.se.play(SYS_SE.BACK)
			displayMode.screen = SCREEN.TITLE
		}
	}
	
	useEffect(()=> {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				back(false)
			}
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => {
			window.removeEventListener("keydown", handleKeyDown)
		}
	}, [])
	
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