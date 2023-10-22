import { motion } from "framer-motion"
import '../styles/saves.scss'
import SavesLayout from "../components/SavesLayout"
import { SCREEN, displayMode, useScreenAutoNavigate } from "../utils/display"
import { useLanguageRefresh } from "../utils/lang"

const LoadScreen = () => {
  useScreenAutoNavigate(SCREEN.LOAD)
  useLanguageRefresh()

  function back(saveLoaded: boolean) {
    if (!saveLoaded)
      displayMode.screen = SCREEN.TITLE
  }
  return (
    <motion.div
      className="page" id="saves"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <SavesLayout variant="load" back={back}/>
      </div>
    </motion.div>
  )
}

export default LoadScreen