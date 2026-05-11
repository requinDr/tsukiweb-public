import { useMemo } from "react"
import { endings } from "features/endings/utils/endings"
import { settings, viewedScene } from "engine/settings"

export const useEclipseUnlocked = () => {
	return useMemo(()=> {
		const sawAllEndings = settings.unlockEverything || Object.values(endings).every(e=>e.seen)
		const sawEclipse = settings.unlockEverything || viewedScene("eclipse")
		return {
			sawAllEndings,
			sawEclipse,
			eclipseUnlocked: sawAllEndings && !sawEclipse
		}
	}, [settings.completedScenes, settings.unlockEverything])
}