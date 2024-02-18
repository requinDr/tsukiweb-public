import { useEffect } from 'react'
import '../styles/title-menu.scss'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import strings, { useLanguageRefresh } from '../utils/lang'
import { bb } from '../utils/Bbcode'
import { jsonDiff, textFileUserDownload } from '../utils/utils'
import { SaveState, listSaveStates } from '../utils/savestates'
import { RecursivePartial } from '../types'
import { defaultSettings, settings } from '../utils/variables'

type Savefile = {
  settings: RecursivePartial<typeof settings>,
  saveStates?: [number, SaveState][],
}

function twoDigits(n: number) {
  return n.toString().padStart(2, '0')
}

const RedirectScreen = () => {
  useLanguageRefresh()

  const exportData = () => {
    const content: Savefile = {
      settings: jsonDiff(settings, defaultSettings),
      saveStates: listSaveStates(),
    }
    const date = new Date()
    const year = date.getFullYear(), month = date.getMonth()+1,
          day = date.getDate(), hour = date.getHours(), min = date.getMinutes()
    const dateString = [year, month, day].map(twoDigits).join('-')
    const timeString = [hour, min].map(twoDigits).join('-')
    textFileUserDownload(JSON.stringify(content), `${dateString}_${timeString}.thfull`, "application/thfull+json")
  }

  return (
    <motion.div
      className="page" id="redirect"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0, transition: {duration: 1}}}
      >

      <div className="box">
        <h1>The address has changed!</h1>
        <p>
          If you were previously playing here, you should export your data using
          the button bellow and import it at the new address.<br />
          Sorry for the inconvenience.
        </p>
        <div className='groups'>
          <div className='group'>
            <div>1</div>
            <button className="config-btn"
              onClick={exportData}>
              Export my data
            </button>
          </div>
          <div className='group'>
            <div>2</div>
            <span>
              Got to the new address <a href="https://tsukiweb.holofield.fr/config?tab=Advanced">
              https://tsukiweb.holofield.fr
            </a>
            </span>
          </div>
        </div>

        <hr />

        <div>
          <div>Consider staring the project</div>
          <a href="https://github.com/requinDr/tsukiweb-public" target="_blank">
            <img src="https://img.shields.io/github/stars/requinDr/tsukiweb-public?style=social" />
          </a>
        </div>
      </div>
    </motion.div>
  )
}

export default RedirectScreen
