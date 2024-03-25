import { useEffect, useState } from "react"
import { ConfigButtons, ConfigItem, ResetBtn } from "../ConfigLayout"
import { defaultSettings, settings } from "../../utils/settings"
import { deepAssign, jsonDiff, requestJSONs, textFileUserDownload } from "../../utils/utils"
import { SaveState, clearSaveStates, listSaveStates, restoreSaveStates } from "../../utils/savestates"
import { strings, languages } from "../../translation/lang"
import { RecursivePartial } from "../../types"
import { toast } from "react-toastify"
import { useLanguageRefresh } from "../hooks/useLanguageRefresh"
import { MdOpenInNew } from "react-icons/md"

function twoDigits(n: number) {
  return n.toString().padStart(2, '0')
}

type Savefile = {
  settings: RecursivePartial<typeof settings>,
  saveStates?: [number, SaveState][],
}

const ConfigAdvancedTab = () => {

  const [conf, setConf] = useState(deepAssign({
    resolution: undefined,
    imagesFolder: undefined,
    language: undefined,
    blurThumbnails: undefined,
    warnHScenes: undefined,
  }, settings, {extend: false}))  
  useLanguageRefresh()

  useEffect(()=> {
    deepAssign(settings, conf)
  }, [conf])

  const updateValue = <T extends keyof typeof conf>(
    key: T,
    value: typeof conf[T]
  ) => setConf(prev => ({ ...prev, [key]: value }))

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

  const importData = async (allExtensions=false) => {
    try {
      const json = (await requestJSONs({accept: allExtensions ? '*' : '.thfull'}) as Savefile[])?.[0] as Savefile|undefined
      if (!json)
        return
      const importedSettings = deepAssign(defaultSettings, json.settings, {clone: true})
      deepAssign(settings, importedSettings)
      if (json.saveStates != undefined) {
        clearSaveStates()
        restoreSaveStates(json.saveStates)
      }

      toast("Your data has been loaded", {
        autoClose: 3000,
        toastId: "loaded-data",
        type: "success",
      })
    } catch (e) {
      toast("Failed to load data", {
        autoClose: 3000,
        toastId: "failed-data",
        type: "error",
      })
    }
  }

  const eraseData = () => {
    if (confirm(strings.config["data-erase-warning"])) {
      clearSaveStates()
      deepAssign(settings, defaultSettings)
      setTimeout(()=> {
        localStorage.clear()
        alert(strings.config["data-erase-confirm"])
      }, 10) // leave room for asynchronous callbacks (if any) to complete
    }
  }

  const reset = () => {
    const defaultConf = deepAssign(structuredClone(conf), defaultSettings, {extend: false})
    setConf(defaultConf)
  }

  return (
    <section>
      <ConfigButtons
        title={strings.config.quality}
        btns={[
          { text: strings.config["quality-sd"], value: 'sd' },
          { text: strings.config["quality-hd"], value: 'hd' },
        ]}
        property="resolution"
        conf={conf}
        updateValue={updateValue}
      />

      <ConfigButtons
        title={strings.config.language}
        desc={strings["translation-desc"] &&
          <>
            {strings["translation-desc"]} <a href={strings["translation-url"]} target="_blank">
              <MdOpenInNew />
            </a>
          </>
        }
        btns={[
          ...Object.entries(languages).map(([id, {"display-name": dispName}])=> {
            return {text: dispName, value: id}
          }),
          //{text: <FaPlus/>, onSelect: createTranslation}
        ]}
        property="language"
        conf={conf}
        updateValue={updateValue}
      />

      <div className="sub">
        <div className="title">{strings.config["adult-title"]}</div>
        <ConfigButtons
          title={strings.config["adult-blur"]}
          btns={[
            { text: strings.config.on, value: true },
            { text: strings.config.off, value: false },
          ]}
          property="blurThumbnails"
          conf={conf}
          updateValue={updateValue}
        />

        <ConfigButtons
          title={strings.config["adult-warn"]}
          btns={[
            { text: strings.config.on, value: true },
            { text: strings.config.off, value: false },
          ]}
          property="warnHScenes"
          conf={conf}
          updateValue={updateValue}
        />
      </div>

      <ConfigItem title={strings.config.data}>
        <div className="config-btns">
          <button className="config-btn"
            onClick={exportData}>
              {strings.config["data-export"]}
          </button>
          <button className="config-btn"
            onClick={importData.bind(null, false)}
            onContextMenu={importData.bind(null, true)}>
            {strings.config["data-import"]}
          </button>
          <button className="config-btn erase"
            onClick={eraseData}>
            {strings.config["data-erase"]}
          </button>
        </div>
      </ConfigItem>

      <ResetBtn onClick={reset} />
    </section>
  )
}

export default ConfigAdvancedTab