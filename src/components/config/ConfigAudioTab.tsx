import { useEffect, useState } from "react"
import { ConfigButtons, ConfigItem, ResetBtn } from "../ConfigLayout"
import { defaultSettings, settings } from "../../utils/settings"
import { deepAssign, negative } from "../../utils/utils"
import { strings } from "../../translation/lang"
import { MdOutlineVolumeOff, MdOutlineVolumeUp, MdVolumeMute } from "react-icons/md"
import { useLanguageRefresh } from "../hooks/useLanguageRefresh"
import PageSection from "@ui-core/layouts/PageSection"

const ConfigAudioTab = () => {
  useLanguageRefresh()
  const [conf, setConf] = useState(deepAssign({
    volume: undefined,
    trackSource: undefined,
    autoMute: undefined
  }, settings, {extend: false}))

  useEffect(()=> {
    deepAssign(settings, conf)
  }, [conf])

  const updateValue = <T extends keyof typeof conf>(
    key: T,
    value: typeof conf[T]
  ) => setConf(prev => ({ ...prev, [key]: value }))

  const updateSubValue = <K extends keyof typeof conf, T extends keyof (typeof conf)[K]>(
    key1: K,
    key2: T,
    value: typeof conf[K][T]
  ) => setConf(prev=> {
    const newConf = structuredClone(prev)
    newConf[key1][key2] = value
    return newConf
  })

  const volumeNames: Record<keyof typeof conf.volume, string> = {
    'master': strings.config["volume-master"],
    'track': strings.config["volume-track"],
    'se': strings.config["volume-se"]
  }

  return (
    <PageSection>
      {(Object.keys(conf.volume) as Array<keyof typeof volumeNames>).map(key=>
        <ConfigItem key={key} title={volumeNames[key]}>
          <div className="config-range">
          <span className="icon"><MdOutlineVolumeOff /></span>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={Math.abs(conf.volume[key])}
              onChange={e => {
                const sign = negative(conf.volume[key]) ? -1 : 1
                updateSubValue('volume', key, sign * parseInt(e.target.value))
              }} />
            <span className="icon"><MdOutlineVolumeUp /></span>

            <button className="mute"
              onClick={()=> updateSubValue('volume', key, -conf.volume[key])}>
              {negative(conf.volume[key]) ? <MdVolumeMute aria-label="mute" /> : <MdOutlineVolumeUp aria-label="unmute" />}
            </button>
          </div>
        </ConfigItem>
      )}
      
      <ConfigButtons
        title={strings.config["track-source"]}
        btns={Object.entries(strings.audio["track-sources"]).map(
          ([id, {name}])=> ({text: name, value: id}))}
        property="trackSource"
        conf={conf}
        updateValue={updateValue}
      />

      
      <ConfigButtons
        title={strings.config['auto-mute']}
        btns={[
          { text: strings.config.on, value: true },
          { text: strings.config.off, value: false },
        ]}
        property="autoMute"
        conf={conf}
        updateValue={updateValue}
      />


      <ResetBtn onClick={() => {
        const defaultConf = deepAssign(structuredClone(conf), defaultSettings, {extend: false})
        setConf(defaultConf)
      }} />
    </PageSection>
  )
}

export default ConfigAudioTab