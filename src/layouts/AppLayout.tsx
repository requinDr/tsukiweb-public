import { settings } from "../utils/settings"
import { useObserver } from "@tsukiweb-common/utils/Observer"

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
	}, settings, "gameFont")

	return children
}

export default AppLayout