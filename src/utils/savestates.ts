import { settings, viewedScene } from "./settings"
import history, { PageEntry, SceneEntry } from '../script/history';
import { APP_VERSION, SAVE_EXT } from "./constants";
import { LabelName } from "../types";
import { SCREEN, displayMode } from "./display";
import { ScriptPlayer } from "script/ScriptPlayer";
import { Graphics, JSONDiff, PartialJSON } from "@tsukiweb-common/types";
import { phaseTexts } from "translation/assets";
import { noBb } from "@tsukiweb-common/utils/Bbcode";
import { SavesManager as SavesManagerBase, SaveState as SSBase } from "@tsukiweb-common/script/saves"
import { updateSave } from "./savestates-update";

//##############################################################################
//#region                       TYPES & CONSTANTS
//##############################################################################

type SaveStateId = number
export const QUICK_SAVE_ID: SaveStateId = 0

type DefaultPageContext = ReturnType<typeof ScriptPlayer.defaultPageContext>
type DefaultBlockContext = ReturnType<typeof ScriptPlayer.defaultBlockContext>

type SSList<T extends PartialJSON, Default extends PartialJSON<T>> = []
  | [JSONDiff<T, Default>]
  | [JSONDiff<T, Default>, ...PartialJSON<T>[], JSONDiff<T, Default>] 

export type SaveState = SSBase & {
  scenes: SSList<SceneEntry, DefaultBlockContext>
  pages: SSList<PageEntry, DefaultPageContext>
  graphics?: Graphics
}

//#endregion ###################################################################
//#region                          SAVES MANAGER
//##############################################################################

class SavesManager extends SavesManagerBase<SaveState> {

  protected override get app_version() { return APP_VERSION }
  protected override get save_ext()    { return SAVE_EXT    }

  protected override import(saves: [number, SaveState][]|{version:string, saveStates:SaveState[]}) {
    if (Array.isArray(saves)) { // < v0.4.0
      saves = {
        version: '0.3.6',
        saveStates: saves.map(([id, save])=>
          (id != save.date) ? {id, ...save} : save)
      }
    }
    //if (versionsCompare(json.version, "1.0.0") < 0) // uncomment if necessary to convert savestates
    saves.version = APP_VERSION
    return super.import(saves)
  }

  override async add(...saves: (SaveState[]|[number, SaveState][])) {
    const resolvedSaves = await Promise.all(
      saves.map(async (save)=> {
        let id
        if (Array.isArray(save)) {
          [id, save] = save
          if (id != save.date)
            save = {id, ...save}
        } else {
          id = save.id ?? save.date
        }
        save = await updateSave(save)
        return save
      })
    )
    
    return super.add(...resolvedSaves)
  }
}

export const savesManager = new SavesManager("savestates")

//#endregion ###################################################################
//#region                          SAVE & LOAD
//##############################################################################

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
export function playScene(scene: LabelName,
  { continueScript = true, viewedOnly = true }) {
  if (viewedOnly && !viewedScene(scene) && !settings.unlockEverything) {
    console.warn(`Can't play "${scene}" because it has not been viewed yet.`)
    return
  }
  history.clear()
  const obj = continueScript ? {label: scene} : {label: scene, continueScript}
  history.loadSaveState({scenes: [obj], pages: []})
  displayMode.screen = SCREEN.WINDOW
}

/**
 * sort savestates quick save first, then from most recent to oldest
 */
export function compareSaveStates(ss1: SaveState, ss2: SaveState) {
	return ss1.id == QUICK_SAVE_ID ? -1 : ss2.id == QUICK_SAVE_ID ? 1
		: (ss2.date ?? 0) - (ss1.date ?? 0)
}

/**
 * Compute the text to be displayed for saves created during phase transitions
 */
export function savePhaseTexts(saveState: SaveState): string[] {
	const { route, routeDay, day } = saveState.pages.at(-1)?.phase ?? {}

	if (route !== undefined && routeDay !== undefined && day !== undefined) {
		return phaseTexts(route, routeDay, day)?.map(noBb)
	}

	return ["", ""]
}

