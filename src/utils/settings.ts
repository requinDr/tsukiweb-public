import { RecursivePartial } from "@tsukiweb-common/types"
import { LabelName, SettingsType } from "../types"
import { observeChildren, observe } from "@tsukiweb-common/utils/Observer"
import { StoredJSON } from "@tsukiweb-common/utils/storage"
import { deepFreeze, deepAssign, jsonDiff, objectsEqual, textFileUserDownload, requestJSONs, twoDigits } from "@tsukiweb-common/utils/utils"
import { TEXT_SPEED, ViewRatio } from "@tsukiweb-common/constants"
import { savesManager, SaveState } from "./savestates"
import { APP_VERSION, FULLSAVE_EXT } from "./constants"
import { toast } from "react-toastify"

export const defaultSettings: SettingsType = deepFreeze({
  textSpeed: TEXT_SPEED.normal,
  autoClickDelay: 500,
  nextPageDelay: 2500,
  fastForwardDelay: 5,
  enableSceneSkip: true,
  preventUnreadSkip: false, // [not implemented]
  
  gameFont: "Ubuntu", // [not implemented]
  uiFont: "Ubuntu", // [not implemented]
  language: "en-mm",
  fixedRatio: ViewRatio.unconstrained,
  
  blurThumbnails: true,
  warnHScenes: false,
  
  volume: {
    master: 5,
    track: 10,
    se: 10,
    titleTrack: 10,
    systemSE: 8,
  },
  trackSource: 'everafter',
  autoMute: true,
  titleMusic: '"*8"',

  unlockEverything: false,

  historyLength: 20,
  savedHistoryLength: 10,

  lastFullExport: {
    date: 0,
    hash: 0
  },
  localStorageWarningDelay: 2 * 24 * 60 * 60 * 1000, // 2 days
  
  eventImages: new Array<string>(),
  completedScenes: new Array<string>(),
})

// load from file
const settingsStorage = new StoredJSON<RecursivePartial<SettingsType>>("settings", false)
let savedSettings = settingsStorage.get() || {} as RecursivePartial<SettingsType>

export const settings = deepAssign(defaultSettings, savedSettings as SettingsType, {
  clone: true, extend: false
})

// deep-copy savedSettings

let savePostPoneTimeoutId: NodeJS.Timeout|0 = 0

function saveSettings() {
  if (savePostPoneTimeoutId) {
    clearTimeout(savePostPoneTimeoutId)
    savePostPoneTimeoutId = 0
  }
  settings.completedScenes.sort()
  const diff = jsonDiff(settings, defaultSettings)
  diff.language = settings.language
  if (!objectsEqual(diff, savedSettings, false)) {
    savedSettings = diff
    if (Object.keys(diff).length == 0)
      settingsStorage.delete()
    else
      settingsStorage.set(savedSettings)
  }
}

function postPoneSaveSettings() {
  if (savePostPoneTimeoutId == 0) {
    savePostPoneTimeoutId = setTimeout(saveSettings, 0)
  }
}

for (const key of Reflect.ownKeys(settings)) {
  const k = key as keyof typeof settings
  if (typeof settings[k] == "object")
    observeChildren(settings, k, postPoneSaveSettings)
  else {
    observe(settings, k, postPoneSaveSettings)
  }
}

/**
 * Return if the specified scene has been viewed by the player.
 */
export function viewedScene(scene: LabelName | string): boolean {
  return settings.completedScenes.includes(scene)
}


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
  settings: RecursivePartial<typeof settings>,
  saveStates?: SaveState[],
}

export const exportGameData = () => {
  const {lastFullExport, ...exportedSettings} = settings
	const content: Savefile = {
		version: APP_VERSION,
		settings: jsonDiff(settings, defaultSettings),
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
      json.version = "0.3.6"
    const importedSettings = deepAssign(defaultSettings, json.settings, {clone: true})
    deepAssign(settings, importedSettings)
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

//TODO clean unused settings from previous versions

declare global {
  interface Window {
    [key: string]: any
  }
}

window.settings = settings
