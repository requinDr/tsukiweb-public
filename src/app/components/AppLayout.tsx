import { useEffect } from "react"
import { settings } from "../../engine/settings"
import { useObserver } from "@tsukiweb-common/utils/Observer"
import { isFontAvailable, loadGoogleFont } from "@tsukiweb-common/utils/fonts"
import { DEFAULT_GAME_FONT } from "@tsukiweb-common/utils/settings"
import { strings } from "translation/lang"
import { useArrowNavigation } from "@tsukiweb-common/hooks"
import { menuKeyMap } from "features/game/utils/keybind"

type Props = {
	children: React.ReactNode
}

const AppLayout = ({ children }: Props) => {
	useObserver(font => {
		const root = document.documentElement
		root.style.setProperty('--game-font', font)
		if (font && font !== DEFAULT_GAME_FONT) {
			if (!isFontAvailable(font, strings.disclaimer.join('')))
				loadGoogleFont(font)
		}
	}, settings, "gameFont")
	useArrowNavigation(menuKeyMap)

	// Load saved font on startup
	useEffect(() => {
		if (settings.gameFont && settings.gameFont !== DEFAULT_GAME_FONT) {
			if (!isFontAvailable(settings.gameFont, strings.disclaimer.join('')))
				loadGoogleFont(settings.gameFont)
		}
	}, [])

	return children
}

export default AppLayout