import { Stored } from "@tsukiweb-common/utils/storage"
import { Queue } from "@tsukiweb-common/utils/queue"
import { Choice, LabelName, RouteDayName, RouteName } from "../types"
import { APP_VERSION, HISTORY_MAX_PAGES } from "./constants"
import { loadSaveState, SaveState } from "./savestates"
import { gameContext } from "./gameContext"
import { isThScene } from "./scriptUtils"
import { skipSceneLabel } from "./script"
import { observe } from "@tsukiweb-common/utils/Observer"
import { displayMode, SCREEN } from "./display"

//##############################################################################
//#region                             TYPES
//##############################################################################

export type PageType = 'text'|'choice'|'skip'|'phase'
type PageJson = ReturnType<(typeof gameContext.pageJson)>
type SceneJson = ReturnType<(typeof gameContext.sceneJson)>
type PageContent<T extends PageType> = (
  T extends 'text' ? { } :
  T extends 'choice' ? {choices: Choice[], selected?: number, label: LabelName} :
  T extends 'skip' ? { } :
  T extends 'phase' ? typeof gameContext.phase :
  never
)
export type PageEntry<T extends PageType = PageType> = 
  PageJson & PageContent<T> & { type: T }

type SceneEntry = ReturnType<(typeof gameContext.sceneJson)>


class History extends Stored {

//#endregion ###################################################################
//#region                      ATTRS, CONSTRUCTOR
//##############################################################################

  private pages: Queue<PageEntry>
  private scenes: Queue<SceneEntry>

  constructor(limit: number = 0) {
    super("history", true, true)
    this.pages = new Queue(limit)
    this.scenes = new Queue()
  }

//#endregion ###################################################################
//#region                            GETTERS
//##############################################################################

  get lastPage() {
    return this.pages.head
  }
  get allPages() {
    return this.pages.slice()
  }
  get pagesLength() {
    return this.pages.length
  }
  get lastScene() {
    return this.scenes.head
  }

  getCurrentText() {
    if (this.pages.length == 0)
      return ""
    const lastPage = this.pages.head
    switch (lastPage.type) {
      case 'text' : return lastPage.text ?? ""
      case 'choice' :
        if (this.pages.length == 1) return ""
        const prevPage = this.pages.get(-2)
        if (prevPage.type == 'text')
          return prevPage.text ?? ""
    }
    return ""
  }
  hasScene(label: LabelName) {
    return this.scenes.findLastIndex(s=>s.label == label) >= 0
  }

//#endregion ###################################################################
//#region                        PRIVATE METHODS
//##############################################################################

  private addPage<T extends PageType>(type: T, content: PageContent<T>) {
    const lastPage = this.pages.empty ? undefined : this.pages.head
    if (lastPage?.type == "text" && (lastPage.text?.length ?? 0) == 0)
      this.pages.popHead() // remove empty text pages from history
    const pageJson = gameContext.pageJson()
    this.pages.push({type, ...pageJson, ...content})
    if (isThScene(pageJson.label) &&
        (this.scenes.empty || this.scenes.head.label != pageJson.label)) {
      this.scenes.push(gameContext.sceneJson())
    }
  }

  private getSceneIndex(pageIndex: number): number {
    const page = this.pages.get(pageIndex)
    let label: LabelName | "" | undefined = page.label
    if (!isThScene(label)) {
      label = this.pages.findLast(p => isThScene(p.label), pageIndex)?.label
      if (!label) {
        label = this.pages.find(p => isThScene(p.label), pageIndex)?.label
        if (!label) // only entry in history. Must be the last scene visited
          return this.scenes.length-1
        // next scene found, return previous one
        return this.scenes.findLastIndex(s => s.label == label) - 1
      }
    }
    return this.scenes.findLastIndex(s=>s.label == label)
  }

  protected serializeToStorage(): string {
    return JSON.stringify({
      pages: this.pages.slice(),
      scenes: this.scenes.slice()
    })
  }

  protected deserializeFromStorage(str: string): void {
    const {pages, scenes} = JSON.parse(str)
    for (const page of pages)
      this.pages.push(page)
    for (const scene of scenes)
      this.scenes.push(scene)
  }

//#endregion ###################################################################
//#region                       INSERTION METHODS
//##############################################################################

  onChoice(choices: Choice[]) {
    this.addPage('choice', {
      choices,
      label: skipSceneLabel(this.scenes.head.label)
    })
  }
  onPhase(route: RouteName|"", routeDay: RouteDayName|"",
          day: number|RouteDayName<'others'>, bg: string) {
    this.addPage('phase', { route, routeDay, day, bg })
  }
  onSceneSkip(sceneJson: SceneJson = gameContext.sceneJson()) {
    this.addPage('skip', { })
    //this.scenes.push(sceneJson)
  }
  onPageBreak() {
    this.addPage('text', { })
  }
  onTextChange() {
    const {text, page} = gameContext
    let lastPage: PageEntry
    if (this.pages.length == 0) {
      this.onPageBreak();
      lastPage = this.pages.head
    } else {
      lastPage = this.pages.head
      if (lastPage.type != "text" || lastPage.page != page) {
        this.onPageBreak()
        lastPage = this.pages.head
      }
    }
    lastPage.text = text.trim()
  }

//#endregion ###################################################################
//#region                         LOAD METHODS
//##############################################################################

  load(index: number) {
    const saveState = this.createSaveState(index)
    if (!saveState)
      return false
    loadSaveState(saveState)
    return true
  }
  loadScene(label: LabelName) {
    const sceneIndex = this.scenes.findLastIndex(s => s.label == label)
    if (sceneIndex < 0)
      return false
    const scene= this.scenes.get(sceneIndex)
    const ss = {
      history: this.scenes.slice(0, sceneIndex),
      page: { label: scene.label },
      date: Date.now(),
      version: APP_VERSION
    } as SaveState
    loadSaveState(ss)
    return true
  }

  onLoad(page: PageEntry) {
    const pageIndex = this.pages.indexOf(page)
    if (pageIndex >= 0) {
      const sceneIndex = this.getSceneIndex(pageIndex)
      // remove future scenes
      this.scenes.spliceHead(this.scenes.length - (sceneIndex + 1))
      // remove future pages including the current one
      this.pages.spliceHead(this.pages.length - pageIndex)
    }
  }
  clear() {
    this.pages.clear()
    this.scenes.clear()
  }

  /**
   * Creates a savestates that contains the scenes history and their flags,
   * and the context of the page at the specified index in the pages history.
   * @param index - index of the page to export, last page by default
   * @returns the created savestate.
   */
  createSaveState(index: number = this.pagesLength-1) {
    if (index < 0)
      index = this.pages.length + index
    const page = this.pages.get(index)
    const sceneIndex = this.getSceneIndex(index)
    return {
      history: this.scenes.slice(0, sceneIndex+1),
      page: page,
      date: Date.now(),
      version: APP_VERSION
    } as SaveState
  }
}
export const history = new History(HISTORY_MAX_PAGES)
window.addEventListener("load", history.restoreFromStorage.bind(history))
observe(gameContext, 'page', history.onPageBreak.bind(history))
observe(gameContext, 'text', history.onTextChange.bind(history))

export default history

declare global {
  interface Window {
    [key: string]: any
  }
}
window.h = history