import '@styles/config.scss'
import { SCREEN, displayMode } from '../utils/display'
import * as motion from "motion/react-m"
import ConfigLayout from '../components/config/ConfigLayout'
import useQueryParam from '@tsukiweb-common/hooks/useQueryParam'
import { useEffect } from 'react'
import { useLanguageRefresh } from 'hooks/useLanguageRefresh'
import { useScreenAutoNavigate } from 'hooks/useScreenAutoNavigate'
import { sysAudio } from 'utils/audio'
import { SYS_SE } from 'utils/constants'

const ConfigScreen = () => {
	useScreenAutoNavigate(SCREEN.CONFIG)
	useLanguageRefresh()
	const [selectedTab, setSelectedTab] = useQueryParam<any>("tab", "game")

	function back() {
		sysAudio.se.play(SYS_SE.BACK)
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
		<motion.div
			className="page" id="config"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<ConfigLayout
				back={back}
				selectedTab={selectedTab}
				setSelectedTab={setSelectedTab}
				page={SCREEN.CONFIG} />
		</motion.div>
	)
}

export default ConfigScreen