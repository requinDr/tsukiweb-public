
import { Choice } from "../types"
import { APP_VERSION, HISTORY_MAX_PAGES } from "../utils/constants"
import { SaveState } from "../utils/savestates"
import { isScene } from "../script/utils"
import { ScriptPlayer } from "script/ScriptPlayer"
import { settings } from "../utils/settings"
import { jsonDiff } from "@tsukiweb-common/utils/utils"
import { HistoryBase } from "@tsukiweb-common/script/history"
import { PartialJSON, WithRequired } from "@tsukiweb-common/types"

//##############################################################################
//#region                             TYPES
//##############################################################################

export type PageType = 'text'|'choice'|'skip'|'phase'|''
type PageContext = ReturnType<ScriptPlayer['pageContext']>
type PageContent<T extends PageType = PageType> = { type: T } & (
  T extends 'text' | 'skip' | 'phase' ? { } :
  T extends 'choice' ? {choices: Choice[], selected: number} :
  never
)
export type PageEntry<T extends PageType = PageType> =
  PageContext & PageContent<T>

export type SceneEntry = NonNullable<ReturnType<ScriptPlayer['blockContext']>>

//#endregion ###################################################################
//#region                          CONSTRUCTOR
//##############################################################################

type Params = {
  limit?: number
  storageId?: string
  restore?: boolean
}

export class History extends HistoryBase<ScriptPlayer, PageType,
  ReturnType<typeof ScriptPlayer.defaultPageContext>,
  ReturnType<typeof ScriptPlayer.defaultBlockContext>, PageContent> {

  constructor({limit = settings.historyLength,
              storageId = "history", restore = false}: Params = {}) {
    super({ limit, storageId, restore,
      defaultPage: ScriptPlayer.defaultPageContext(),
      defaultBlock: ScriptPlayer.defaultBlockContext()
    })
  }

//#endregion ###################################################################
//#region                            METHODS
//##############################################################################

  protected isScene = isScene

//________________________________page creation_________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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

  onPageStart(context: PageContext): void {
    const {label} = context
    if (isScene(label) || (label.startsWith('skip') && context.page == 0))
      super.onPageStart(context)
  }

//_________________________________save & load__________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
    const graphics = includeGraphics && this.script ?
        jsonDiff({graphics: this.script.graphics}, result.pages.at(-1)!)
        : { }
    return {
      ...result,
      ...graphics,
      date: Date.now(),
      version: APP_VERSION
    } as SaveState
  }

  loadSaveState = super.import
  getPageContext = super.getMergedContext
  onPageLoad = super.rollbackToPage
  onSceneLoad = super.rollbackToScene
}

//#endregion ###################################################################
//#region                          GLOBAL VARS
//##############################################################################

export const history = new History({
  limit: HISTORY_MAX_PAGES,
  storageId:'history',
  restore: true
})
export default history
window.h = history