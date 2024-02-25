import { motion } from "framer-motion"
import '../styles/saves.scss'
import { SCREEN, displayMode, useScreenAutoNavigate } from "../utils/display"
import strings, { useLanguageRefresh } from "../utils/lang"
import { Flowchart } from "../components/Flowchart"
import { Link } from "react-router-dom"

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
        <div className="header">
          <Link to={SCREEN.TITLE} className="menu-btn">
            {strings.back}
          </Link>
          <div>Currently WIP</div>
        </div>

        <Flowchart back={back}/>
      </div>
    </motion.div>
  )
}

export default FlowchartScreen