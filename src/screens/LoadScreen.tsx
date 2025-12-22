import * as m from "motion/react-m"
import '@styles/saves.scss'
import SavesLayout from "../components/save/SavesLayout"
import { SCREEN, displayMode } from "../utils/display"
import { useEffect } from "react"
import { useScreenAutoNavigate, useLanguageRefresh } from "hooks"
import useKeyArrows from "hooks/useKeyArrows"


const LoadScreen = () => {
	useScreenAutoNavigate(SCREEN.LOAD)
	useLanguageRefresh()
	useKeyArrows()

	function back(saveLoaded: boolean) {
		if (!saveLoaded)
			displayMode.screen = SCREEN.TITLE
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
		<m.div
			className="page" id="saves"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<div className="page-content">
				<SavesLayout variant="load" back={back}/>
			</div>
		</m.div>
	)
}

export default LoadScreen