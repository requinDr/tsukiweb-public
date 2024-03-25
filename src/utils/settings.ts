import { ResolutionId, TranslationId, LangJson } from "../translation/lang"
import { RecursivePartial, ViewRatio } from "../types"
import { observeChildren, observe } from "./Observer"
import { TEXT_SPEED } from "./constants"
import { StoredJSON } from "./storage"
import { deepFreeze, deepAssign, jsonDiff, objectsEqual } from "./utils"

export const defaultSettings = deepFreeze({
  // scene settings
  textSpeed: TEXT_SPEED.normal,
  autoClickDelay: 500,
  nextPageDelay: 2500,
  fastForwardDelay: 5,
  enableSceneSkip: true, // ask to skip scenes
  preventUnreadSkip: false, // [not implemented]
  // graphics settings
  font: "Ubuntu", // [not implemented]
  textPanelOpacity: 0.5, // [not implemented]
  resolution: "hd" as ResolutionId,
  language: "en-mm" as TranslationId,
  fixedRatio: ViewRatio.unconstrained,
  // H-related settings
  blurThumbnails: true,
  warnHScenes: false,
  // audio settings
  volume: {
    master: 5,
    track: 10,
    se: 10,
  },
  trackSource: 'everafter' as keyof LangJson["audio"]["track-sources"],
  autoMute: true,
  // saved progress
  eventImages: new Array<string>(),
  completedScenes: new Array<string>(),
})

type SettingsType = typeof defaultSettings

// load from file
const settingsStorage = new StoredJSON<RecursivePartial<SettingsType>>("settings", false)
let savedSettings = settingsStorage.get() || {} as RecursivePartial<SettingsType>

export const settings = deepAssign(defaultSettings, savedSettings as SettingsType, {clone: true})

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

//TODO clean unused settings from previous versions

window.settings = settings