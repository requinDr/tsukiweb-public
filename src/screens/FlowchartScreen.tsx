import { motion } from "framer-motion"
import '../styles/saves.scss'
import { SCREEN, displayMode } from "../utils/display"
import { strings } from "../translation/lang"
import { Flowchart } from "../components/Flowchart"
import { useLanguageRefresh } from "../components/hooks/useLanguageRefresh"
import { useScreenAutoNavigate } from "../components/hooks/useScreenAutoNavigate"
import FixedFooter from "@ui-core/components/FixedFooter"
import MenuButton from "@ui-core/components/MenuButton"
import BlueContainer from "@ui-core/components/BlueContainer"

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
      <div className="page-content">
        <Flowchart back={back}/>
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