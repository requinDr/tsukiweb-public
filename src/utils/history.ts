
import { Choice, LabelName, RouteDayName, RouteName } from "../types"
import { APP_VERSION, HISTORY_MAX_PAGES } from "./constants"
import { SaveState } from "./savestates"
import { isScene } from "../script/utils"
import { ScriptPlayer } from "script/ScriptPlayer"
import { PartialJSON, RecursivePartial } from "@tsukiweb-common/types"
import { settings } from "./settings"
import { jsonDiff, jsonMerge } from "@tsukiweb-common/utils/utils"
import { HistoryBase } from "@tsukiweb-common/script/history"

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

export type SceneEntry = NonNullable<ReturnType<ScriptPlayer['blockContext']>>

type Params = {
  limit?: number
  storageId?: string
  restore?: boolean
}

export class History extends HistoryBase<ScriptPlayer, PageType,
  ReturnType<typeof ScriptPlayer.defaultPageContext>,
  ReturnType<typeof ScriptPlayer.defaultBlockContext>> {

//#endregion ###################################################################
//#region                      ATTRS, CONSTRUCTOR
//##############################################################################

  private _script: ScriptPlayer | undefined

  constructor({limit = settings.historyLength,
              storageId = "history", restore = false}: Params = {}) {
    super({ limit, storageId, restore,
      defaultPage: ScriptPlayer.defaultPageContext(),
      defaultBlock: ScriptPlayer.defaultBlockContext()
    })
    
    this._script = undefined
  }

//#endregion ###################################################################
//#region                        PRIVATE METHODS
//##############################################################################

  protected isScene(label: LabelName): boolean {
    return isScene(label)
  }

//#endregion ###################################################################
//#region                       INSERTION METHODS
//##############################################################################

  onChoicePrompt(choices: Choice[]) {
    this.setPage({ type: 'choice', choices, selected: -1 })
  }

  onChoiceSelected(selection: number) {
    const lastPage = this.lastPage
    if (lastPage.type != "choice") {
      throw Error("current page is not of type 'choice'")
    }
    (lastPage as PageEntry<'choice'>).selected = selection
  }

  onPhase(script: ScriptPlayer) {
    if (this.pageContext == undefined) {
       // workaround to prevent issue with scene 414 missing '\' before phase.
       // Fixed in pre-processing on 22/09/25. Remove when all script caches
       // are cleared.
      script.text = ""
      this.onPageStart(script.pageContext()!)
    }
    this.setPage({type: 'phase'})
  }
  
  onSceneSkip(script: ScriptPlayer, label: LabelName) {
    this.onPageStart({...script.pageContext()!, label, page: 0})
    this.setPage({type: 'skip', label, page: 0})
  }

  onPageStart(context: PageContext): void {
    const {label} = context
    if (isScene(label) || (label.startsWith('skip') && context.page == 0))
      super.onPageStart(context)
  }

  onTextChange(script: ScriptPlayer) {
    if (script.text.length == 0)
      return
    const text = script.text.replace(/^\[\r\n]*/, '')
    if (this.pages.length > 0) {
      let lastPage = this.lastPage
      if (lastPage.page == script.currentBlock?.page &&
          lastPage.label == script.currentBlock.label)
        lastPage.text = text
      else
        this.setPage({type: 'text', text})
    } else {
      this.setPage({type: 'text', text})
    }
  }

//#endregion ###################################################################
//#region                         LOAD METHODS
//##############################################################################
  
  getCurrentContext() {
    const scene = this.scenes.get(-1)
    if (!scene)
      throw Error(`history is empty (no scene)`)
    const page = this.pages.get(-1) ?? this.pages.default
    return {
      ...scene,
      ...page,
    }
  }

  getPageContext(index: number = -1) {
    const page = this.pages.get(index)
    if (!page)
      throw Error(`no page in history at index ${index}`)
    const sceneIndex = this.getSceneIndexAtPage(index)
    if (sceneIndex < 0)
      throw Error(`Unable to retrieve scene ${page.label} from history`)
    const scene = this.scenes.get(sceneIndex)!
    return {
      ...scene,
      ...page
    }
  }

  onPageLoad(index: number) {
    this.loadSaveState(this.createSaveState(index, this.pagesLength))
  }

  onSceneLoad(index: number) {
    const scene = this.scenes.get(index) as SceneEntry
    const firstPageIndex = this.pages.findIndex(p=>p.label == scene.label && p.page == 0)
    if (firstPageIndex >= 0)
      this.onPageLoad(firstPageIndex)
    else {
      this.loadSaveState({
        scenes: this.scenes.exportJSON(0, index+1),
        pages: []
      })
    }
  }

  /**
   * Creates a savestates that contains the scenes history and their flags,
   * and the context of the page at the specified index in the pages history.
   * @param index - index of the page to export, last page by default
   * @returns the created savestate.
   */
  createSaveState(index: number = this.pagesLength,
      pagesMaxLength = Math.max(settings.savedHistoryLength, 1)) {
    const includeGraphics = (index == this.pagesLength)
    if (includeGraphics)
      index--
    const result = super.export(index, pagesMaxLength)
    const graphics = includeGraphics && this._script ?
        jsonDiff({graphics: this._script.graphics}, result.pages.at(-1)!)
        : {}
    return {
      ...result,
      ...graphics,
      date: Date.now(),
      version: APP_VERSION
    } as SaveState
  }

  loadSaveState(ss: Pick<SaveState, 'scenes'|'pages'>) {
    super.import(ss)
  }
}

export const history = new History({
  limit: HISTORY_MAX_PAGES,
  storageId:'history',
  restore: true
})
export default history
window.h = history