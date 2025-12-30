import '@styles/config.scss'
import { SCREEN, displayMode } from '../utils/display'
import * as m from "motion/react-m"
import ConfigLayout, { ConfigTabs } from '../components/config/ConfigLayout'
import useQueryParam from '@tsukiweb-common/hooks/useQueryParam'
import { useEffect } from 'react'
import { useLanguageRefresh } from 'hooks/useLanguageRefresh'
import { useScreenAutoNavigate } from 'hooks/useScreenAutoNavigate'
import { useKeyArrows } from 'hooks'

const ConfigScreen = () => {
	useScreenAutoNavigate(SCREEN.CONFIG)
	useLanguageRefresh()
	useKeyArrows()
	const [selectedTab, setSelectedTab] = useQueryParam<ConfigTabs>("tab", ConfigTabs.game)

	function back() {
		displayMode.screen = SCREEN.TITLE
	}

	useEffect(()=> {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				back()
			}
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => {
			window.removeEventListener("keydown", handleKeyDown)
		}
	}, [])

	return (
		<m.div
			className="page" id="config"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<ConfigLayout
				back={back}
				selectedTab={selectedTab}
				setSelectedTab={setSelectedTab}
			/>
		</m.div>
	)
}

export default ConfigScreen