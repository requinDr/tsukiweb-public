import { useEffect } from "react"
import { settings } from "../utils/settings"
import { useObserver } from "@tsukiweb-common/utils/Observer"
import { loadGoogleFont } from "../utils/fonts"
import { DEFAULT_GAME_FONT } from "@tsukiweb-common/utils/settings"

type Props = {
	children: React.ReactNode
}

const AppLayout = ({ children }: Props) => {
	useObserver(font => {
		const root = document.documentElement
		root.style.setProperty('--ui-font', font)
	}, settings, "uiFont")
	useObserver(font => {
		const root = document.documentElement
		root.style.setProperty('--game-font', font)
		if (font && font !== DEFAULT_GAME_FONT) {
			loadGoogleFont(font)
		}
	}, settings, "gameFont")

	// Load saved font on startup
	useEffect(() => {
		if (settings.gameFont && settings.gameFont !== DEFAULT_GAME_FONT) {
			loadGoogleFont(settings.gameFont)
		}
	}, [])

	return children
}

export default AppLayout