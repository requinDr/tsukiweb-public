import { motion } from "framer-motion"
import '../styles/flowchart.scss'
import { SCREEN, displayMode } from "../utils/display"
import { strings } from "../translation/lang"
import { useLanguageRefresh } from "../components/hooks/useLanguageRefresh"
import { useScreenAutoNavigate } from "../components/hooks/useScreenAutoNavigate"
import FixedFooter from "@tsukiweb-common/ui-core/components/FixedFooter"
import MessageContainer from "@tsukiweb-common/ui-core/components/MessageContainer"
import Flowchart from "components/flowchart/Flowchart"
import Button from "@tsukiweb-common/ui-core/components/Button"

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
				<Button
					variant="menu"
					to={SCREEN.TITLE}
				>
					{strings.back}
				</Button>
				<MessageContainer style={{display: 'inline-flex', float: "right"}}>
					Thumbnails are a work in progress
				</MessageContainer>
			</FixedFooter>
		</motion.div>
	)
}

export default FlowchartScreen