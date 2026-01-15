import { settings, viewedScene } from "./settings"
import history, { PageEntry, SceneEntry } from '../script/history';
import { APP_VERSION, SAVE_EXT } from "./constants";
import { LabelName, RouteDayName, RouteName } from "../types";
import { SCREEN, displayMode } from "./display";
import { versionsCompare } from "@tsukiweb-common/utils/utils";
import { Regard, ScriptPlayer } from "script/ScriptPlayer";
import { Graphics, JSONDiff, PartialJSON, PartialRecord } from "@tsukiweb-common/types";
import { fetchBlockLines, getPageAtLine, isScene } from "script/utils";
import { phaseTexts } from "translation/assets";
import { noBb } from "@tsukiweb-common/utils/Bbcode";
import { SavesManager as SavesManagerBase, SaveState as SSBase } from "@tsukiweb-common/script/saves"

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

  override add(...saves: (SaveState[]|[number, SaveState][])) {
    Promise.all(saves.map(async (save)=> {
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
    })).then((saves: SaveState[])=> super.add(...saves))
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

async function updateSave(ss: SaveState): Promise<SaveState> {
  const version = ss.version ?? '0.3.6' // last version without a 'version' attribute
  if (versionsCompare(ss.version, "0.4.0") < 0) {
    ss = await v0_4_0_updateSave(ss)
  }
  if (versionsCompare(ss.version, "0.5.0") < 0) {
    ss = await v0_5_0_updateSave(ss)
  }
  return ss
}

//#endregion ###################################################################
//#region                         < v0.4.0 UPDATE
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

async function v0_4_0_updateSave(ss: SaveState): Promise<SaveState> {
  if (!Object.hasOwn(ss, 'context')) { // Fix errors with previous saves
    return {                           // getting updated without the change
      ...ss,                           // of version number. Added 2025-09-08
      version: "0.4.0"
    }
  }
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
      textBox: page.textBox ?? "nvl",
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
//#endregion ###################################################################
//#region                         < v0.5.0 UPDATE
//##############################################################################

const mergedScenes = {
  's23' : ['s22', 35],
  's24' : ['s21', 36],
  's58' : ['s57', 64],
  's59' : ['s57', 64],
}

async function v0_5_0_updateSave(ss: SaveState): Promise<SaveState> {
  const { pages, scenes } = ss

  ss.version = "0.5.0"
  let s, i
  
  if ((i = scenes.findIndex(s=>s.label == 's23')) >= 0)
    (i == 0)? scenes[i]!.label = 's22' : scenes.splice(i, 1)
  if ((i = scenes.findIndex(s=>s.label == 's24')) >= 0)
    (i == 0)? scenes[i]!.label = 's23' : scenes.splice(i, 1)
  if (s = scenes.find(s=>s.label == 's47')) s.label = 's46'
  if (s = scenes.find(s=>s.label == 's37')) s.label = 's201'
  if ((i = scenes.findIndex(s=>s.label == 's58')) >= 0)
    (i == 0) ? scenes[i]!.label = 's57' : scenes.splice(i, 1)
  if ((i = scenes.findIndex(s=>s.label == 's59')) >= 0)
    (i == 0) ? scenes[i]!.label = 's57' : scenes.splice(i, 1)
  if (s = scenes.find(s=>s.label == 's60')) s.label = 's62'
  if (s = scenes.find(s=>s.label == 's61')) s.label = 's63'

  for (const [j, p] of pages.entries()) {
    if (p.label && Object.hasOwn(mergedScenes, p.label)) {
      const [prevLabel, defaultPage] = mergedScenes[p.label as keyof typeof mergedScenes]
        // if possible, calculate correct page number using last page of previous scene
        i = j-1
        while (i >= 0 && pages[i].label == p.label)
          i--
        if (pages[i].label == prevLabel)
          p.page = (pages[i].page ?? 0) + (j-i)
        // otherwise, use english version page count
        else
          p.page = (p.page ?? 0) + (defaultPage as number)
        p.label = prevLabel as LabelName
    }
    else switch (p.label) {
      case 's37' : p.label = 's201'; break
      case 's47' : p.label = 's46'; break
      case 'f117' : p.label = 'skip116a'; break
      case 'skip23' : p.label = 'skip22'; break
      case 'skip24' : p.label = 'skip21'; break
      case 'skip37' : p.label = 'skip201'; break
    }
  }
  
  // if s40 not finished yet, and coming from s201, decrement %regard_aki
  if (pages?.at(-1)?.label == 's40' && scenes.find(s=>s.label == 's201')
      && scenes.at(-1)!.regard!.aki)
    scenes.at(-1)!.regard!.aki!-- // "inc %regard_aki" moved from f38 to skip40
  
  return ss
}