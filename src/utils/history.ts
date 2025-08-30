import { Stored } from "@tsukiweb-common/utils/storage"
import { Queue } from "@tsukiweb-common/utils/queue"
import { Choice, LabelName } from "../types"
import { APP_VERSION, HISTORY_MAX_PAGES } from "./constants"
import { SaveState } from "./savestates"
import { isScene } from "../script/utils"
import { ScriptPlayer } from "script/ScriptPlayer"
import { PartialJSON, RecursivePartial } from "@tsukiweb-common/types"
import { settings } from "./settings"
import { jsonDiff, jsonMerge } from "@tsukiweb-common/utils/utils"

//##############################################################################
//#region                             TYPES
//##############################################################################


export type PageType = 'text'|'choice'|'skip'|'phase'|''
type PageContext = NonNullable<ReturnType<ScriptPlayer['pageContext']>>
type PageContent<T extends PageType> = (
  T extends 'text' | 'skip' | 'phase' ? { } :
  T extends 'choice' ? {choices: Choice[], selected: number} :
  never
)
export type PageEntry<T extends PageType = PageType> = { type: T } &
  PageContext & PageContent<T>

class PagesQueue extends Queue<PageEntry> {
  exportJSON(start: number = 0, stop: number = this.length): SaveState['pages'] {
    const defaultValue = ScriptPlayer.defaultPageContext()
    const pages = this.all().slice(start, stop)
    return Array.from(pages, (p, i)=>
      (i == 0 || i == pages.length-1) ?
        jsonDiff(p, defaultValue)
      : jsonDiff(p, { ...this.get(i-1), type: 'text' })
    ) as SaveState['pages']
  }
  importJSON(pages: SaveState['pages']) {
    const defaultValue = ScriptPlayer.defaultPageContext()
    this.clear()
    const mergedPages: Array<PageEntry> = new Array(pages.length)
    pages.forEach((p, i, pages)=> {
      if (i == 0 || i == pages.length - 1)
        mergedPages[i] = jsonMerge(p as NonNullable<SaveState['pages'][0]>, defaultValue)
      else
        mergedPages[i] = jsonMerge(p as PartialJSON<PageEntry>, {...mergedPages[i-1], type: 'text'} as PageEntry)
    })
    this.push(...mergedPages)
  }
}

class ScenesQueue extends Queue<SceneEntry> {
  exportJSON(start: number = 0, stop: number = this.length): SaveState['scenes'] {
    const defaultvalue =ScriptPlayer.defaultBlockContext()
    const scenes = this.all().slice(start, stop)
    return Array.from(scenes, (s, i)=>
      (i == 0 || i == scenes.length-1) ?
        jsonDiff(s, defaultvalue)
      : jsonDiff(s, this.get(i-1) as SceneEntry)
    ) as SaveState['scenes']
  }
  importJSON(scenes: SaveState['scenes']) {
    const defaultValue = ScriptPlayer.defaultBlockContext()
    this.clear()
    const mergedScenes: Array<SceneEntry> = new Array(scenes.length)
    scenes.forEach((s, i)=> {
      if (i == 0 || i == scenes.length-1)
        mergedScenes[i] = jsonMerge(s as NonNullable<SaveState['scenes'][0]>, defaultValue)
      else
        mergedScenes[i] = jsonMerge(s as PartialJSON<SceneEntry>, mergedScenes[i-1])
    })
    this.push(...mergedScenes)
  }
}

export type SceneEntry = NonNullable<ReturnType<ScriptPlayer['blockContext']>>

type Params = {
  limit?: number
  storageId?: string
  restore?: boolean
}
export class History extends Stored {

//#endregion ###################################################################
//#region                      ATTRS, CONSTRUCTOR
//##############################################################################

  private _pages: PagesQueue
  private _scenes: ScenesQueue
  private _pageContext: PageContext|undefined
  private _script: ScriptPlayer|undefined

  constructor({limit = settings.historyLength,
              storageId = "history", restore = false}: Params = {}) {
    super(storageId, true, true)
    this._pages = new PagesQueue(limit)
    this._scenes = new ScenesQueue()
    this._pageContext = undefined
    this._script = undefined
    if (restore)
      this.restoreFromStorage()
  }

//#endregion ###################################################################
//#region                           ACCESSORS
//##############################################################################

  get lastPage() {
    return this._pages.head
  }
  get allPages() {
    return this._pages.slice()
  }
  get pagesLength() {
    return this._pages.length
  }
  get lastScene() {
    return this._scenes.head
  }
  get pagesLimit() {
    return this._pages.limit
  }
  set pagesLimit(value: number) {
    this._pages.limit = value
  }
  get empty() {
    return this._scenes.empty// && this._pages.empty // checking pages should not be necessary
  }

  sceneIndex(label: LabelName) {
    return this._scenes.findLastIndex(s=>s.label == label)
  }
  
  hasScene(label: LabelName) {
    return this.sceneIndex(label) >= 0
  }

//#endregion ###################################################################
//#region                        PRIVATE METHODS
//##############################################################################

  private setPage<T extends PageType>(type: T,
      content: PageContent<T> & RecursivePartial<PageContext>) {
    if (this._pageContext) {
      const c = jsonMerge({...content, type}, this._pageContext)
      this._pages.push(c as PageEntry)
      this._pageContext = undefined
    } else {
      throw Error(`Page context already used`)
    }
  }

  private getSceneAtPage(pageIndex: number): number {
    const page = this._pages.get(pageIndex) as PageEntry
    let label: LabelName|undefined = page.label
    if (!isScene(label)) {
      // not a scene => search previous pages
      label = this._pages.findLast(p=>isScene(p.label), pageIndex)?.label
      if (!label) {
        // no valid label found in previous pages. Search on next pages
        label = this._pages.find(p=>isScene(p.label), pageIndex)?.label
        if (!label) // only entry in history. Must be the last scene visited
          return this._scenes.length-1
        // next scene found, return previous one
        return this._scenes.findLastIndex(s => s.label == label) - 1
      }
    }
    return this._scenes.findLastIndex(s=>s.label == label)
  }

  protected override serializeToStorage(): string {
    return JSON.stringify({
      pages: this._pages.slice(),
      scenes: this._scenes.slice()
    })
  }

  protected override deserializeFromStorage(str: string): void {
    const {pages, scenes} = JSON.parse(str)
    for (const page of pages)
      this._pages.push(page)
    for (const scene of scenes)
      this._scenes.push(scene)
  }

//#endregion ###################################################################
//#region                       INSERTION METHODS
//##############################################################################

  onChoicePrompt(choices: Choice[]) {
    this.setPage('choice', {
      choices,
      //label: nextLabel(this._scenes.head.label as LabelName), // use 'skip{<prev label>}' as the label
      selected: -1
    })
  }
  onChoiceSelected(selection: number) {
    const lastPage = this.lastPage
    if (lastPage.type != "choice") {
      throw Error("current page is not of type 'choice'")
    }
    (lastPage as PageEntry<'choice'>).selected = selection
  }
  onPhase() {
    this.setPage('phase', { })
  }
  onSceneSkip(script: ScriptPlayer, label: LabelName) {
    this._pageContext = {...script.pageContext()!, label, page: 0}
    this.setPage('skip', {label})
  }
  onPageStart(script: ScriptPlayer) {
    const label = script.currentLabel as LabelName
    if (isScene(label) || (label.startsWith("skip") && (
        script.currentBlock as NonNullable<typeof script.currentBlock>).page == 0)
      ) {
      this._pageContext = script.pageContext()!
      if (this._pages.length > 0) { // remove duplicate last page if necessary
        const lastPage = this.lastPage
        if (lastPage.page == this._pageContext.page &&
            lastPage.label == this._pageContext.label)
          this._pages.splice(-1)
      }
    }
  }
  onTextChange(script: ScriptPlayer) {
    if (script.text.length == 0)
      return
    const text = script.text.replace(/^\[\r\n]*/, '')
    if (this._pages.length > 0) {
      let lastPage = this.lastPage
      if (lastPage.page == script.currentBlock?.page &&
          lastPage.label == script.currentBlock.label)
        lastPage.text = text
      else
        this.setPage('text', {text})
    } else {
        this.setPage('text', {text})
    }
  }
  onBlockStart(script: ScriptPlayer, label: LabelName = script.currentLabel!) {
    this._script = script
    if (isScene(label) && label != this.lastScene.label) {
      this._scenes.push({...script.blockContext() as SceneEntry, label})
    }
  }

//#endregion ###################################################################
//#region                         LOAD METHODS
//##############################################################################

  getPageContext(index: number = this._pages.length-1) {
    if (this._pages.empty) {
      return {
        ...this._scenes.get(-1)
      }
    } else {
      const page = this._pages.get(index) as PageEntry
      let label = page.label
      let sceneContext
      if (isScene(label))
        sceneContext = this.getSceneContext(label)
      else if (index > 0) {
        do {
          index --;
          label = this._pages.get(index)!.label
        } while (index > 0 && !isScene(label))
        sceneContext = this.getSceneContext(label)
      }
      return { ...sceneContext, ...page }
      
    }
  }

  getSceneContext(label: LabelName) {
    const sceneIndex = this._scenes.findLastIndex(s => s.label == label)
    if (sceneIndex < 0)
      return undefined
    return this._scenes.get(sceneIndex)
  }

  onPageLoad(index: number) {
    this.loadSaveState(this.createSaveState(index, this.pagesLength))
  }
  onSceneLoad(index: number) {
    const scene = this._scenes.get(index) as SceneEntry
    const firstPageIndex = this._pages.findIndex(p=>p.label == scene.label && p.page == 0)
    if (firstPageIndex >= 0)
      this.onPageLoad(firstPageIndex)
    else {
      this.loadSaveState({
        scenes: this._scenes.exportJSON(0, index+1),
        pages: []
      })
    }
  }
  clear() {
    this._pages.clear()
    this._scenes.clear()
  }

  /**
   * Creates a savestates that contains the scenes history and their flags,
   * and the context of the page at the specified index in the pages history.
   * @param index - index of the page to export, last page by default
   * @returns the created savestate.
   */
  createSaveState(index: number = this.pagesLength,
      pagesMaxLength = Math.max(settings.savedHistoryLength, 1)) {
    if (index < 0)
      index = this._pages.length + index
    const includeGraphics = (index == this.pagesLength)
    if (includeGraphics)
      index--
    const sceneIndex = this.getSceneAtPage(index)
    const firstPageIndex = Math.max(0, index + 1 - pagesMaxLength)
    const pages = this._pages.exportJSON(firstPageIndex, index+1)
    const graphics = includeGraphics && this._script ?
        jsonDiff({graphics: this._script.graphics}, pages.at(-1)!)
        : {}
    return {
      scenes: this._scenes.exportJSON(0, sceneIndex+1),
      pages: pages,
      ...graphics,
      date: Date.now(),
      version: APP_VERSION
    } as SaveState
  }

  loadSaveState(ss: Pick<SaveState, 'scenes'|'pages'>) {
    this.clear()
     // TODO filter scenes and pages (jsonDiff with default)
    if (ss.scenes.length == 0) {
      if (ss.pages.length == 0) {
        console.error(ss)
        throw Error("no page and no scene in savestate")
      } else {
        const label = ss.pages.at(-1)!.label as LabelName
        this._scenes.importJSON([{label}])
        this._pages.importJSON(ss.pages)
      }
    } else if (ss.pages.length == 0) {
        this._scenes.importJSON(ss.scenes)
    } else {
        this._scenes.importJSON(ss.scenes)
        this._pages.importJSON(ss.pages)
    }
  }
}

export const history = new History({
  limit: HISTORY_MAX_PAGES,
  storageId:'history',
  restore: true
})
export default history
window.h = history