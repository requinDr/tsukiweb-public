import { RecursivePartial } from "@tsukiweb-common/types"
import { LabelName, SettingsType } from "../types"
import { observeChildren, observe } from "@tsukiweb-common/utils/Observer"
import { StoredJSON } from "@tsukiweb-common/utils/storage"
import { deepFreeze, deepAssign, jsonDiff, objectsEqual } from "@tsukiweb-common/utils/utils"
import { TEXT_SPEED, ViewRatio } from "@tsukiweb-common/constants"

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
    savePostPoneTimeoutId = 0
    clearTimeout(savePostPoneTimeoutId)
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

//TODO clean unused settings from previous versions

window.settings = settings
