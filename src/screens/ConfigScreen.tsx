import '../styles/config.scss'
import { SCREEN, displayMode } from '../utils/display'
import { motion } from 'framer-motion'
import ConfigLayout from '../components/ConfigLayout'
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'

const ConfigScreen = () => {
  useScreenAutoNavigate(SCREEN.CONFIG)
  useLanguageRefresh()
  const urlParams = new URLSearchParams(window.location.search)

  const setUrl = (activeTab: string) => {
    const baseUrl = window.location.origin + window.location.pathname
    window.history.replaceState({}, "", `${baseUrl}?tab=${activeTab}`)
  }

  function back() {
    displayMode.screen = SCREEN.TITLE
  }
  return (
    <motion.div
      className="page" id="config"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <ConfigLayout
          back={back}
          selectedTab={urlParams.get("tab") as any}
          setUrl={setUrl}
          page={SCREEN.CONFIG} />
      </div>
    </motion.div>
  )
}

export default ConfigScreen