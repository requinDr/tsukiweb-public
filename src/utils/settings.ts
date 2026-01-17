import { JSONObject, NoMethods, PartialJSON } from "@tsukiweb-common/types"
import { Settings as SettingsBase } from "@tsukiweb-common/utils/settings"
import { textFileUserDownload, requestJSONs, twoDigits } from "@tsukiweb-common/utils/utils"
import { savesManager, SaveState } from "./savestates"
import { APP_VERSION, FULLSAVE_EXT } from "./constants"
import { toast } from "react-toastify"
import { TrackSourceId } from "translation/lang"

const restoreSymbol = Symbol("restore")

class Settings extends SettingsBase {
  
  language: string = "en-mm"

  trackSource: TrackSourceId = 'tsukibako'
  titleMusic: string = '"*8"'
  
  eventImages: Array<string> = new Array()

  override getDiff() {
    const diff = super.getDiff()
    diff.language = this.language // force language to be stored
    return diff
  }
  
  /**
   * Allow {@link importGameData} to use the `restore` method
   */
  [restoreSymbol](obj: JSONObject) {
    this.restore(obj)
  }
  protected override restore(diff: JSONObject | PartialJSON): void {
    // change replaced scenes in completed scenes list
    const completedScenes = ((diff as Partial<Settings>).completedScenes ?? [])
    const redirectedScenes = {
      's23': null , 's24': null , 's47': 's46',
      's58': 's57', 's59': 's57', 's60': 's62',
      's61': 's63' }
    for (const [label, replace] of Object.entries(redirectedScenes)) {
      const i = completedScenes.indexOf(label)
      if (i >= 0) {
        completedScenes.splice(i, 1)
        if (replace)
          completedScenes.push(replace)
      }
    }

    // update censorship settings
    // let blurThumbnails: any, warnHScenes: any
    // ({ blurThumbnails, warnHScenes, ...diff } = diff)
    // if (blurThumbnails as boolean|undefined == false)
    //   (diff as Partial<Settings>).censorship = 'none'

    super.restore(diff)
  }
  
  constructor() {
    super("settings", false)
  }
}

export const settings = new Settings()


export async function computeSaveHash() {
  // compute hash from event images, completed scenes and savestates
  const buffer = new TextEncoder().encode(JSON.stringify({
    eventImages: settings.eventImages,
    completedScenes: settings.completedScenes,
    saves: savesManager.listSaves()
  }))
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', buffer)
  const lastQuad = new Uint32Array(hashBuffer).at(-1)
  if (lastQuad == undefined)
    throw Error(`Empty hash`)
  return lastQuad
}

type Savefile = {
  version: string
  settings: PartialJSON<NoMethods<Settings>>,
  saveStates?: SaveState[],
}

export const exportGameData = () => {
  const {lastFullExport, ...exportedSettings} = settings
	const content: Savefile = {
		version: APP_VERSION,
		settings: settings.getDiff(),
		saveStates: savesManager.listSaves(),
	}
	const date = new Date()
	const year = date.getFullYear(), month = date.getMonth()+1,
				day = date.getDate(), hour = date.getHours(), min = date.getMinutes()
	const dateString = [year, month, day].map(twoDigits).join('-')
	const timeString = [hour, min].map(twoDigits).join('-')
	textFileUserDownload(JSON.stringify(content), `${dateString}_${timeString}.${FULLSAVE_EXT}`, `application/${FULLSAVE_EXT}+json`)
  const timeStamp = date.getTime()
  settings.lastFullExport.date = timeStamp
  computeSaveHash().then(hash=> {
    if (settings.lastFullExport.date == timeStamp)
      settings.lastFullExport.hash = hash
  })
}

export const importGameData = async (accept = `.${FULLSAVE_EXT}`) => {
  try {
    const json = (await requestJSONs({accept}) as Savefile[])?.[0] as Savefile|undefined
    if (!json)
      return
    if (!json.version)
      json.version = "0.3.6" // last version without a 'version' attribute
    settings[restoreSymbol](json.settings)
    if (json.saveStates != undefined) {
      savesManager.clear()
      savesManager.add(...json.saveStates)
    }
    const timeStamp = Date.now()
    settings.lastFullExport.date = timeStamp
    computeSaveHash().then(hash=> {
      if (settings.lastFullExport.date == timeStamp)
        settings.lastFullExport.hash = hash
    })

    toast("Your data has been loaded", {
      toastId: "loaded-data",
      type: "success",
    })
  } catch (e) {
    console.error(e)
    toast("Failed to load data", {
      toastId: "failed-data",
      type: "error",
    })
  }
}

// expose viewedScene outside the settings object
export const viewedScene = settings.viewedScene.bind(settings)

//TODO clean unused settings from previous versions

declare global {
  interface Window {
    [key: string]: any
  }
}

window.settings = settings
