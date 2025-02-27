import { settings } from "../utils/settings"
import { useObserver } from "@tsukiweb-common/utils/Observer"
import { ViewRatio } from "@tsukiweb-common/constants"

type Props = {
	children: React.ReactNode
}

const AppLayout = ({ children }: Props) => {
	useObserver(font => {
		const root = document.documentElement
		root.style.setProperty('--font', font)
	}, settings, "font")

	useObserver(ratio => {
		const root = document.documentElement
		if (ratio == ViewRatio.unconstrained) {
			root.style.setProperty('--ratio', "initial")
			root.style.setProperty('--width', "100%")
		} else {
			root.style.setProperty('--ratio', `${ratio}`)
			root.style.setProperty('--width', "initial")
		}
	}, settings, "fixedRatio")

	return (
		<div id="root-view">
			{children}
		</div>
	)
}

export default AppLayout