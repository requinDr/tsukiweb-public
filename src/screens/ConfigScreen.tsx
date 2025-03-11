import '../styles/config.scss'
import { SCREEN, displayMode } from '../utils/display'
import * as motion from "motion/react-m"
import ConfigLayout from '../components/ConfigLayout'
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'
import useQueryParam from '@tsukiweb-common/hooks/useQueryParam'

const ConfigScreen = () => {
	useScreenAutoNavigate(SCREEN.CONFIG)
	useLanguageRefresh()
	const [selectedTab, setSelectedTab] = useQueryParam("tab", "game")

	function back() {
		displayMode.screen = SCREEN.TITLE
	}
	return (
		<motion.div
			className="page" id="config"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<ConfigLayout
				back={back}
				selectedTab={selectedTab as any}
				setSelectedTab={setSelectedTab}
				page={SCREEN.CONFIG} />
		</motion.div>
	)
}

export default ConfigScreen