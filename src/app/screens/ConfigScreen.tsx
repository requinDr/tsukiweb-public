import '@features/config/styles/config.scss'
import * as m from "motion/react-m"
import { useEffect } from 'react'
import { useQueryParam } from '@tsukiweb-common/hooks'
import ConfigLayout, { ConfigTabs } from 'features/config/components/ConfigLayout';
import { useKeyArrows, useLanguageRefresh, useScreenAutoNavigate } from 'app/hooks';
import { SCREEN, displayMode } from 'app/utils/display';

const ConfigScreen = () => {
	useScreenAutoNavigate(SCREEN.CONFIG)
	useLanguageRefresh()
	useKeyArrows()
	const [selectedTab, setSelectedTab] = useQueryParam<ConfigTabs>("tab", ConfigTabs.game)

	function handleBack() {
		displayMode.screen = SCREEN.TITLE
	}

	useEffect(()=> {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				handleBack()
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
				onBack={handleBack}
				selectedTab={selectedTab}
				setSelectedTab={setSelectedTab}
			/>
		</m.div>
	)
}

export default ConfigScreen