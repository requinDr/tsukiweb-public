import { gameContext } from "./gameContext";
import { settings, viewedScene } from "./settings"
import history, { PageEntry, PageType } from './history';
import { toast } from "react-toastify";
import { FaSave } from "react-icons/fa"
import { SAVE_EXT } from "./constants";
import { LabelName } from "../types";
import { SCREEN, displayMode } from "./display";
import { StoredJSON } from "@tsukiweb-common/utils/storage";
import { TSForceType, textFileUserDownload, requestJSONs, version_compare } from "@tsukiweb-common/utils/utils";
import { strings } from "translation/lang";
import script from "./script";

//##############################################################################
//#region                       TYPES & CONSTANTS
//##############################################################################

export type SaveState<T extends PageType = PageType> = {
  history: Array<ReturnType<typeof gameContext.sceneJson>>
  page: PageEntry<T>
  date: number
  version: string
}
type SaveStateId = number
export const QUICK_SAVE_ID: SaveStateId = 0

//#endregion ###################################################################
//#region                        LOCAL VARIABLES
//##############################################################################

const savesStorage = new StoredJSON<Iterable<[SaveStateId, SaveState]>>("savestates", false)
const saveStates = new Map<SaveStateId, SaveState>()
const listeners = new Array<VoidFunction>()


//#endregion ###################################################################
//#region                            STORAGE
//##############################################################################

{
  const restored = savesStorage.get()
  if (restored)
    restoreSaveStates(restored)
}

function updateLocalStorage() {
  savesStorage.set(Array.from(saveStates.entries()))
}

//____________________________________Store_____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Store the savestate in a map with the specified id.
 * If a previous savestate has the same id, the new one replaces it.
 * @param id unique id of the savestate in the map.
 * @param ss savestate to store.
 */
export function storeSaveState(id: SaveStateId, ss: SaveState) {
  saveStates.set(id, ss)
  updateLocalStorage()
  notifyListeners()
}

/**
 * Store all the savestates from the iterator in the savestates map
 * @param keyValuePairs iterator of [id, savestate].
 */
export function restoreSaveStates(keyValuePairs: Iterable<[SaveStateId, SaveState]>) {
  for (const [id, ss] of keyValuePairs) {
    saveStates.set(id, ss as SaveState)
  }
  updateLocalStorage()
  notifyListeners()
}
//___________________________________Delete_____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Delete from the savestate map the savesate with the specified id
 * @param id unique id of the savestate in the map.
 */
export function deleteSaveState(id: SaveStateId) {
  saveStates.delete(id)
  updateLocalStorage()
  notifyListeners()
}

/**
 * Delete all savestates from the savestates map.
 */
export function clearSaveStates() {
  saveStates.clear()
  updateLocalStorage()
  notifyListeners()
}
//___________________________________Getters____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export function getSaveState(id: SaveStateId) {
  return saveStates.get(id)
}

export function hasSaveStates() {
  return saveStates.size > 0 || history.pagesLength > 0
}

/**
 * Creates an iterator of key-value pairs from the stored savestates,
 * where the key is the id of the savestate in the map, and the value
 * is the savestate itself.
 * @returns the created iterator.
 */
export function listSaveStates(): Array<[SaveStateId, SaveState]> {
  return Array.from(saveStates.entries())
}

export function getLastSave(): SaveState|undefined {
  if (saveStates.size == 0)
    return undefined
  return Array.from(saveStates.values()).reduce(
    (ss1, ss2) => ss1.date > ss2.date ? ss1 : ss2)
}

//_______________________________Saves listeners________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export function addSavesChangeListener(onChange: VoidFunction) {
  if (listeners.indexOf(onChange) >= 0)
    return
  listeners.push(onChange)
}

export function removeSavesChangeListener(onChange: VoidFunction) {
  const index = listeners.indexOf(onChange)
  if (index == -1)
    return false
  listeners.splice(index, 1)
  return true
}

function notifyListeners() {
  for (const listener of listeners) {
    listener()
  }
}

//#endregion ###################################################################
//#region                          SAVE & LOAD
//##############################################################################

//____________________________________Save______________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


/**
 * Store the last savestate from the script'shistory into the savestate map,
 * with the specified id.
 * @param id unique id of the savestate in the map.
 */
export function storeCurrentState(id: SaveStateId) {
  const ss = history.createSaveState()
  if (!ss)
    return false
  storeSaveState(id, ss)
  return true
}

/**
 * Stores the last savestate of the script's history in the savestate map
 * with the id 'quick".
 */
export const quickSave = () => {
  if (storeCurrentState(QUICK_SAVE_ID)) {
    toast(strings.game["toast-qsave"], {
      icon: () => FaSave({}),
      autoClose: 1400,
      toastId: "qs-toast",
    })
  } else {
    toast(strings.game["toast-save-fail"], {
      autoClose: 2400,
      toastId: "qs-toast",
      type: "warning"
    })
  }
}

//____________________________________Load______________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Restore the context and progress from the specified savestate.
 * If the savestate is stored in the script's history, all pages
 * after the one associated with the savestate will be removed from the history.
 * @param ss savestate to load, or its id in the savestate map.
 * @returns true if the savestate has been loaded, false otherwise.
 */
export function loadSaveState(ss: SaveStateId | SaveState) {
  if (ss.constructor == Number) {
    ss = saveStates.get(ss) as SaveState
    if (ss) {
      toast(strings.game["toast-qload"], {
        icon: () => FaSave({}),
        autoClose: 1400,
        toastId: 'ql-toast',
      })
    } else {
      toast(strings.game["toast-load-fail"], {
        autoClose: 2400,
        toastId: 'ql-toast',
        type: "warning"
      })
    }
  }
  if (ss) {
    TSForceType<SaveState>(ss)
    if (ss.version && version_compare(ss.version, "0.3.4") > 0) {
      history.onLoad(ss.page)
      let page = ss.page
      if (page.type == "text")
        page = {...page, text: ""}
      let index = script.getPageIndex(page.page)
      gameContext.load({...page, index})
    } else { // < v0.3.5: no scene history, split progress
      history.clear()
      const page = script.getPageAtIndex((ss as any).context.index)
      gameContext.load({...(ss as any).context, ...(ss as any).progress, page})
    }
    return true
  }
  return false
}

/**
 * Loads the savestate with the id 'quick' from the script's history,
 * and restores the context and progress from it.
 */
export const quickLoad = ()=> {
  if (loadSaveState(QUICK_SAVE_ID)) {
    toast(strings.game["toast-qload"], {
      icon: () => FaSave({}),
      autoClose: 1400,
      toastId: 'ql-toast'
    })
  } else {
    toast(strings.game["toast-load-fail"], {
      autoClose: 2400,
      toastId: 'ql-toast',
      type: "warning"
    })
  }
}

export function newGame() {
  history.clear()
  gameContext.load({label: 'openning'})
  displayMode.screen = SCREEN.WINDOW
}

export async function continueGame() {
  // restart from beginning of last visisted page ...
  const lastSave = history.pagesLength ? history.createSaveState()
              // or from last saved game
              : getLastSave()
              // or ask user to provide save file(s).
              // Also retrieves settings from the save file(s)
              ?? await loadSaveFiles().then(getLastSave)
  if (lastSave) {
    loadSaveState(lastSave)
    displayMode.screen = SCREEN.WINDOW
  }
}

/**
 * Play the specified scene
 * @param scene scene to play
 * @param continueScript if true, the script will continue to the next scene. Default is true.
 * @param viewedOnly if true, the scene will only be played if it has been viewed by the player. Default is true.
 */
export function playScene(scene: LabelName, {
                            continueScript = true,
                            viewedOnly = true
                          } = {}) {
  if (viewedOnly && !viewedScene(scene) && !settings.unlockEverything) {
    return
  }
  history.clear()
  gameContext.load({label: scene}, continueScript)
  displayMode.screen = SCREEN.WINDOW
}


//#endregion ###################################################################
//#region                          SAVE FILES
//##############################################################################

function twoDigits(n: number) {
  return n.toString().padStart(2, '0')
}
/**
 * Export the save-states to json files and lets the user
 * download it.
 * @param ids array of save-state ids to export. Exporting multiple save-states
 *            will result in multiple files being downloaded
 */
export function exportSave(ids: SaveStateId[]) {
  const saveStates = listSaveStates().filter(([id,_ss])=>ids.includes(id))
  for (const [id, ss] of saveStates) {
    const json = JSON.stringify({ id, ...ss }),
          date = new Date(ss.date as number)
    const year = date.getFullYear(), month = date.getMonth()+1,
          day = date.getDate(), hour = date.getHours(), min = date.getMinutes()
    const dateString = [year, month, day].map(twoDigits).join('-')
    const timeString = [hour, min].map(twoDigits).join('-')
    textFileUserDownload(json, `${dateString}_${timeString}.thweb`, "application/thweb+json")
  }
}
/**
 * Restores save-states from one or multiple files requested
 * to the user or from the specified stringified JSONs.
 * @param saves stringified JSONs, or undefined to ask files from the user.
 */
export async function loadSaveFiles(
    saves?: string[] | FileList | undefined | null,
    allExtensions=false
  ): Promise<boolean> {
  let jsons
  if (saves instanceof FileList) {
    jsons = await Promise.all(Array.from(saves).map(file=> {
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.readAsText(file)
        reader.onload = (evt) => {
          if (evt.target?.result?.constructor == String)
            resolve(JSON.parse(evt.target.result))
          else
            throw Error(`cannot read save file ${file.name}`)
        }
      })
    }));
  } else if (saves) {
    jsons = saves.map(save=>JSON.parse(save))
  } else {
    jsons = await requestJSONs({multiple: true, accept: allExtensions ? '*' : `.${SAVE_EXT}`})
  }
  if (!jsons)
    return false
  restoreSaveStates(jsons.map(({id, ...save})=>{
    if (id == undefined || id.constructor != Number)
      throw Error(`Save-file is missing 'id' field`)
    return [id, save] as [number, SaveState]
  }))
  return true
}