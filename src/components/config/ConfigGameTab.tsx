import { useEffect, useState } from "react"
import { ConfigButtons, ConfigItem, ResetBtn } from "../ConfigLayout"
import { defaultSettings, settings } from "../../utils/variables"
import { ViewRatio } from "../../types"
import { TEXT_SPEED } from "../../utils/constants"
import { addEventListener, deepAssign, isFullscreen, toggleFullscreen } from "../../utils/utils"
import { FaMinus, FaPlus } from "react-icons/fa"
import strings, { useLanguageRefresh } from "../../utils/lang"

const ConfigGameTab = () => {
  useLanguageRefresh()
  const [conf, setConf] = useState(deepAssign({
    // object only used for its structure. Values don't matter.
    textSpeed: undefined,
    fixedRatio: undefined,
    autoClickDelay: undefined,
    nextPageDelay: undefined,
  }, settings, {extend: false}))

  const [fullscreen, setFullscreen] = useState<boolean>(isFullscreen()) // don't save in settings

  useEffect(()=> {
    deepAssign(settings, conf)
  }, [conf])

  useEffect(()=> {
    return addEventListener({event: 'fullscreenchange', handler: ()=> {
      setFullscreen(isFullscreen())
    }})
  }, [])

  const updateValue = <T extends keyof typeof conf>(
    key: T,
    value: typeof conf[T]
  ) => setConf(prev => ({ ...prev, [key]: value }))
  
  const numFormat = new Intl.NumberFormat(strings.locale, { maximumSignificantDigits: 3 })
  const msToS = (ms: number)=> {
    return numFormat.format(ms/1000)
  }

  return (
    <section>
      <ConfigButtons
        title={strings.config.ratio}
        btns={[
          { text: strings.config["ratio-auto"], value: ViewRatio.unconstrained },
          { text: strings.config["ratio-4-3"], value: ViewRatio.fourByThree },
          { text: strings.config["ratio-16-9"], value: ViewRatio.sixteenByNine }
        ]}
        property="fixedRatio"
        conf={conf}
        updateValue={updateValue}
      />

      <ConfigButtons
        title={strings.config.fullscreen}
        btns={[
          { text: strings.config.on, value: true },
          { text: strings.config.off, value: false },
        ]}
        property="fullscreen"
        conf={{fullscreen}}
        updateValue={toggleFullscreen}
      />

      <ConfigButtons
        title={strings.config["text-speed"]}
        btns={[
          { text: strings.config["text-speed-low"], value: TEXT_SPEED.slow },
          { text: strings.config["text-speed-med"], value: TEXT_SPEED.normal },
          { text: strings.config["text-speed-high"], value: TEXT_SPEED.fast },
          { text: strings.config["text-speed-instant"], value: TEXT_SPEED.instant }
        ]}
        property="textSpeed"
        conf={conf}
        updateValue={updateValue}
      />

      <ConfigItem title={strings.config["auto-play-delay-text"].replace('$0',msToS(conf.autoClickDelay))}>
        <div className="config-range">
        <span className="icon"><FaMinus /></span>
          <input
            type="range"
            min={0}
            max={3000}
            step={100}
            value={conf.autoClickDelay}
            onChange={e => {
              updateValue('autoClickDelay', parseInt(e.target.value))
            }} />
          <span className="icon"><FaPlus /></span>
        </div>
      </ConfigItem>

      <ConfigItem title={strings.config["auto-play-delay-page"].replace('$0',msToS(conf.nextPageDelay))}>
        <div className="config-range">
        <span className="icon"><FaMinus /></span>
          <input
            type="range"
            min={0}
            max={3000}
            step={100}
            value={conf.nextPageDelay}
            onChange={e => {
              updateValue('nextPageDelay', parseInt(e.target.value))
            }} />
          <span className="icon"><FaPlus /></span>
        </div>
      </ConfigItem>

      <ResetBtn onClick={() => {
        const defaultConf = deepAssign(structuredClone(conf), defaultSettings, {extend: false})
        setConf(defaultConf)
      }} />
    </section>
  )
}

export default ConfigGameTab