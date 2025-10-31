import { settings } from "../utils/settings"
import { useObserver } from "@tsukiweb-common/utils/Observer"
import { ViewRatio } from "@tsukiweb-common/constants"

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

	useObserver(ratio => {
		const root = document.documentElement
		if (ratio == ViewRatio.unconstrained) {
			root.style.setProperty('--ratio', "initial")
			root.style.setProperty('--max-size', "100%")
		} else {
			root.style.setProperty('--ratio', `${ratio}`)
			root.style.setProperty('--max-size', "initial")
		}
	}, settings, "fixedRatio")

	return children
}

export default AppLayout