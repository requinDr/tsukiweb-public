import { RecursivePartial } from "@tsukiweb-common/types"
import { LabelName, SettingsType } from "../types"
import { observeChildren, observe } from "@tsukiweb-common/utils/Observer"
import { StoredJSON } from "@tsukiweb-common/utils/storage"
import { deepFreeze, deepAssign, jsonDiff, objectsEqual, textFileUserDownload } from "@tsukiweb-common/utils/utils"
import { TEXT_SPEED, ViewRatio } from "@tsukiweb-common/constants"
import { savesManager, SaveState } from "./savestates"
import { APP_VERSION } from "./constants"

export const defaultSettings: SettingsType = deepFreeze({
  textSpeed: TEXT_SPEED.normal,
  autoClickDelay: 500,
  nextPageDelay: 2500,
  fastForwardDelay: 5,
  enableSceneSkip: true,
  preventUnreadSkip: false, // [not implemented]
  
  font: "Ubuntu", // [not implemented]
  resolution: "hd",
  language: "en-mm",
  fixedRatio: ViewRatio.unconstrained,
  
  blurThumbnails: true,
  warnHScenes: false,
  
  volume: {
    master: 5,
    track: 10,
    se: 10,
    titleTrack: 10,
    systemSE: 10,
  },
  trackSource: 'everafter',
  autoMute: true,
  titleMusic: '"*8"',

  unlockEverything: false,

  historyLength: 20,
  savedHistoryLength: 10,
  
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


function twoDigits(n: number) {
  return n.toString().padStart(2, '0')
}

type Savefile = {
  version: string
  settings: RecursivePartial<typeof settings>,
  saveStates?: SaveState[],
}

export const exportGameData = () => {
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
	textFileUserDownload(JSON.stringify(content), `${dateString}_${timeString}.thfull`, "application/thfull+json")
}

//TODO clean unused settings from previous versions

declare global {
  interface Window {
    [key: string]: any
  }
}

window.settings = settings
