import { motion } from "framer-motion"
import '../styles/flowchart.scss'
import { SCREEN, displayMode } from "../utils/display"
import { strings } from "../translation/lang"
import { useLanguageRefresh } from "../components/hooks/useLanguageRefresh"
import { useScreenAutoNavigate } from "../components/hooks/useScreenAutoNavigate"
import FixedFooter from "@tsukiweb-common/ui-core/components/FixedFooter"
import MenuButton from "@tsukiweb-common/ui-core/components/MenuButton"
import BlueContainer from "@tsukiweb-common/ui-core/components/BlueContainer"
import Flowchart from "components/flowchart/Flowchart"

const FlowchartScreen = () => {
	useScreenAutoNavigate(SCREEN.SCENES)
	useLanguageRefresh()

	function back(sceneLoaded: boolean) {
		if (!sceneLoaded)
			displayMode.screen = SCREEN.TITLE
	}
	return (
		<motion.div
			className="page" id="scenes"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<div className="page">
				<Flowchart back={back} />
			</div>

			<FixedFooter>
				<MenuButton to={SCREEN.TITLE}>
					{strings.back}
				</MenuButton>
				<BlueContainer style={{display: 'inline-flex', float: "right"}}>
					Thumbnails are a work in progress
				</BlueContainer>
			</FixedFooter>
		</motion.div>
	)
}

export default FlowchartScreen