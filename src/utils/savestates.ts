import { settings, viewedScene } from "./settings"
import history, { History, PageEntry, SceneEntry } from './history';
import { toast } from "react-toastify";
import { FaSave } from "react-icons/fa"
import { APP_VERSION, SAVE_EXT } from "./constants";
import { LabelName, RouteDayName, RouteName } from "../types";
import { SCREEN, displayMode } from "./display";
import { Stored } from "@tsukiweb-common/utils/storage";
import { textFileUserDownload, versionsCompare } from "@tsukiweb-common/utils/utils";
import { strings } from "translation/lang";
import { Regard, ScriptPlayer } from "script/ScriptPlayer";
import { Graphics, JSONDiff, PartialJSON, PartialRecord } from "@tsukiweb-common/types";
import { fetchBlockLines, getPageAtLine, isScene } from "script/utils";

//##############################################################################
//#region                       TYPES & CONSTANTS
//##############################################################################

type SaveStateId = number
export const QUICK_SAVE_ID: SaveStateId = 0
const SAVE_MIME_TYPE = "application/thweb+json"

type DefaultPageContext = ReturnType<typeof ScriptPlayer.defaultPageContext>
type DefaultBlockContext = ReturnType<typeof ScriptPlayer.defaultBlockContext>

type SSList<T extends PartialJSON, Default extends PartialJSON<T>> = []
  | [JSONDiff<T, Default>]
  | [JSONDiff<T, Default>, ...PartialJSON<T>[], JSONDiff<T, Default>] 

export type SaveState = {
  scenes: SSList<SceneEntry, DefaultBlockContext>
  pages: SSList<PageEntry, DefaultPageContext>
  graphics?: Graphics
  date: number
  version: string
  name?: string
  id?: SaveStateId
}

function twoDigits(n: number) {
  return n.toString().padStart(2, '0')
}

//#endregion
//##############################################################################


class SavesManager extends Stored {

  private _saveStates: Map<SaveStateId, SaveState>
  private _changeListeners: Set<VoidFunction>

  constructor() {
    super("savestates", false)
    this._saveStates = new Map()
    this._changeListeners = new Set
    this.restoreFromStorage()
  }

//##############################################################################
//#region                        PRIVATE METHODS
//##############################################################################

  private _notifyListeners() {
    for (const listener of this._changeListeners) {
      listener()
    }
  }

  protected serializeToStorage(): string {
    return JSON.stringify({
      version: APP_VERSION,
      saveStates: Array.from(this._saveStates.values())
    })
  }

  protected deserializeFromStorage(str: string): void {
    const json = JSON.parse(str) as [number, SaveState][]|{version:string, saveStates:SaveState[]}
    if (Array.isArray(json)) { // < v0.4.0
      this.add(...json.map(([id, save])=> 
        (id != save.date) ? {id, ...save} : save
      ))
    } else {
      //if (versionsCompare(json.version, "1.0.0") < 0) // uncomment if necessary to convert savestates
      const saveStates = json.saveStates
      for (const save of saveStates) {
        this._saveStates.set(save.id ?? save.date, save)
      }
      this._notifyListeners()
    }
  }

//#endregion ###################################################################
//#region                           LISTENERS
//##############################################################################

  addListener(listener: VoidFunction) {
    this._changeListeners.add(listener)
  }
  removeListener(listener: VoidFunction) {
    this._changeListeners.delete(listener)
  }

//#endregion ###################################################################
//#region                            GETTERS
//##############################################################################
  
  get savesCount() {
    return this._saveStates.size
  }

  listSaves() {
    return Array.from(this._saveStates.values())
  }

  get(id: SaveStateId) {
    return this._saveStates.get(id)
  }

  getLastSave(): SaveState|undefined {
    return this.listSaves().reduce((a, b)=> a.date > b.date ? a : b)
  }

  /**
   * Export the save-states to json files and lets the user download them.
   * @param ids array of save-state ids to export. Exporting multiple save-states
   *            will result in multiple files being downloaded
   */
  exportSave(...ids: SaveStateId[]) {
    for (const id of ids) {
      const ss = this.get(id)
      if (!ss)
        continue
      const json = JSON.stringify({ id, ...ss }),
            date = new Date(ss.date as number)
      const year = date.getFullYear(), month = date.getMonth()+1,
            day = date.getDate(), hour = date.getHours(), min = date.getMinutes()
      const dateString = [year, month, day].map(twoDigits).join('-')
      const timeString = [hour, min].map(twoDigits).join('-')
      let basename = `${dateString}_${timeString}`
      if (ss.name)
        basename += `_${ss.name}`
      textFileUserDownload(json, `${basename}.${SAVE_EXT}`, SAVE_MIME_TYPE)
    }
  }

//#endregion ###################################################################
//#region                          EDIT SAVES
//##############################################################################

  clear() {
    this._saveStates.clear()
    this.deleteStorage()
    this._notifyListeners()
  }

  add(...saves: (SaveState|[number, SaveState])[]) {
    Promise.all(saves.map(async (save)=> {
      let id
      if (Array.isArray(save)) {
        [id, save] = save
        if (id != save.date)
          save = {id, ...save}
      } else {
        id = save.id ?? save.date
      }
      const ss = await updateSave(save)
      this._saveStates.set(id, ss)
    })).then(()=> {
      this.saveToStorage()
      this._notifyListeners()
    })
  }

  remove(id: SaveStateId) {
    this._saveStates.delete(id)
    this.saveToStorage()
    this._notifyListeners()
  }

  async importSave(save: string|File): Promise<void> {
    if (save instanceof File)
      save = await new Promise<string>((resolve)=> {
        const reader = new FileReader()
        reader.readAsText(save as File)
        reader.onload = (evt)=> {
          if (evt.target?.result?.constructor == String)
            resolve(evt.target.result)
          else
            throw Error(`Cannot read save file ${(save as File).name}`)
        }
      })
    this.add(JSON.parse(save) as SaveState)
  }

  async importSaveFiles(saves: string[] | FileList | File[]): Promise<void> {
    await Promise.all(
      Array.from<string|File, Promise<void>>(saves, this.importSave.bind(this)))
  }
}

export const savesManager = new SavesManager()


//#endregion ###################################################################
//#region                          SAVE & LOAD
//##############################################################################

//____________________________________Save______________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


/**
 * Stores the last savestate of the script's history in the savestate map
 * with the id 'quick".
 */
export function quickSave(history: History) {
  const ss = {
    id: 0,
    ...history.createSaveState()
  }
  savesManager.add(ss)
  toast(strings.game["toast-qsave"], {
    icon: () => FaSave({}),
    autoClose: 1400,
    toastId: "qs-toast",
  })
  //} else {
  //  toast(strings.game["toast-save-fail"], {
  //    autoClose: 2400,
  //    toastId: "qs-toast",
  //    type: "warning"
  //  })
  //}
}
export function quickLoad(history: History, onLoad: VoidFunction) {
  const ss = savesManager.get(QUICK_SAVE_ID)
  if (ss) {
    history.loadSaveState(ss)
    toast(strings.game["toast-qload"], {
      icon: () => FaSave({}),
      autoClose: 1400,
      toastId: 'ql-toast'
    })
    onLoad()
  } else {
    toast(strings.game["toast-load-fail"], {
      autoClose: 2400,
      toastId: 'ql-toast',
      type: "warning"
    })
  }
}

export function newGame() {
  history.loadSaveState({scenes: [{label: 'openning'}], pages: []})
  displayMode.screen = SCREEN.WINDOW
}

export async function continueGame() {
  // restart from beginning of last visisted page ...
  const lastSave = history.pagesLength ? history.createSaveState()
              // or from last saved game
              : savesManager.getLastSave()
  if (lastSave) {
    history.loadSaveState(lastSave)
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
  const obj = continueScript ? {label: scene} : {label: scene, continueScript}
  history.loadSaveState({scenes: [obj], pages: []})
  displayMode.screen = SCREEN.WINDOW
}


//#endregion ###################################################################
//#region                         FORMAT UPDATE
//##############################################################################

type OldRegard = PartialRecord<'ark'|'ciel'|'akiha'|'kohaku'|'hisui', number>
function regard_update(regard: OldRegard): Regard {
  return {
    ark : regard.ark    ?? 0,
    cel : regard.ciel   ?? 0,
    aki : regard.akiha  ?? 0,
    koha: regard.kohaku ?? 0,
    his : regard.hisui  ?? 0,
  }
}
function phase_update(phase: Record<string, string|number>|undefined) {
  let route, routeDay, day
  if (phase) {
    route = phase.route
    routeDay = phase.routeDay
    day = phase.day
    if (routeDay == "") {
      routeDay = day
      day = 0
    }
  } else {
    // use default values. SaveItem should use scene title if available
    route = 'others'
    routeDay = 'pro'
    day = 0
  }
  return {
    route   : route    as RouteName,
    routeDay: routeDay as RouteDayName,
    day     : day      as RouteDayName<'others'> | number
  }
}
async function updateSave(ss: SaveState): Promise<SaveState> {
  if (ss.version && versionsCompare(ss.version, "0.4.0") >= 0)
    return ss
  else {
    const {context, progress, page, graphics} = ss as any
    const pageNum = isScene(context.label) ?
      getPageAtLine(await fetchBlockLines(context.label), context.index)
      : 0
    return {
      scenes: [{
        label: context.label,
        flags: progress.flags ?? [],
        regard: regard_update(progress.regard ?? {})
      }],
      pages: [{
        label: context.label,
        page: pageNum,
        text: page.text ?? "",
        textPrefix: page.textPrefix ?? "",
        audio: context.audio ?? {},
        graphics: context.graphics ?? {},
        phase: phase_update(context.phase),
        ...(page.contentType == "text" ? { type: "text" }
          : page.contentType == "skip" ? { type: "skip" }
          : page.contentType == "phase" ? { type: "phase" }
          : { type: "choice",
            choices: page.choices,
            selected: page.selected
          }
        )
      }],
      graphics: graphics,
      date: ss.date,
      version: APP_VERSION
    }
  }
}