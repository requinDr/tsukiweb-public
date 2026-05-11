import * as m from "motion/react-m"
import '@features/save/styles/saves.scss'
import { useEffect } from "react"
import SavesLayout from "features/save/components/SavesLayout";
import { useKeyArrows, useLanguageRefresh, useScreenAutoNavigate } from "app/hooks";
import { SCREEN, displayMode } from "app/utils/display";


const LoadScreen = () => {
	useScreenAutoNavigate(SCREEN.LOAD)
	useLanguageRefresh()
	useKeyArrows()

	function handleBack(saveLoaded: boolean) {
		if (!saveLoaded)
			displayMode.screen = SCREEN.TITLE
	}
	
	useEffect(()=> {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				handleBack(false)
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
				<SavesLayout variant="load" onBack={handleBack}/>
			</div>
		</m.div>
	)
}

export default LoadScreen