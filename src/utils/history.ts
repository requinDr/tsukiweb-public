import { Choice, PageArgs, PageContent, PageType, SceneName } from "../types"
import { HISTORY_MAX_PAGES } from "./constants"
import { SaveState, createSaveState } from "./savestates"

class History {
  private pages: SaveState[]
  private limit: number
  private listeners: VoidFunction[]

  /**
   * @param limit maximum number of pages. If 0 or unset, no limit is
   *              applied.
   */
  constructor(limit: number = 0) {
    this.pages = []
    this.limit = limit
    this.listeners = []
  }

  /**
   * number of items in the queue.
   */
  get length(): number {
    return this.pages.length
  }

  get empty(): boolean {
    return this.pages.length === 0
  }

  /**
   * oldest page in the queue. Next to be removed
   */
  get first(): SaveState {
    return this.pages[0]
  }

  /**
   * Most recent page in the queue.
   */
  get last(): SaveState {
    return this.pages[this.pages.length - 1]
  }

  /**
   * Get the page at the specified index in the buffer
   * @param index index of the page to get
   * @returns the page in the buffer at {@link index}
   */
  get(index: number) {
    if (index >= 0)
      return this.pages[index]
    else
      return this.pages[this.pages.length + index]
  }

  /**
   * Remove the oldest pages to fit the buffer size in the specified limit.
   * Nothing happens if the limit is not set (= 0).
   */
  private clean() {
    const overflow = this.pages.length - this.limit
    if (this.limit > 0 && overflow > 0)
      this.trimFirsts(overflow)
  }

  /**
   * Empty the buffer.
   */
  clear() {
    this.pages.splice(0, this.pages.length)
    this.onChange()
  }

  /**
   * Append the element at the end of the queue.
   * If the limit is exceeded, remove the oldest pages
   * @param elmt element to insert
   * @returns this
   */
  push<T extends PageType>(elmt: SaveState<T>): typeof this {
    this.pages.push(elmt)
    this.clean()
    this.onChange()
    return this
  }

  /**
   * Push a new page to the history
   * @param contentType type of the page
   */
  private createPage<T extends PageType>(contentType: T, ...args: PageArgs<T>) {
    let content
    switch(contentType) {
      case "text" :
        content = { text: args[0] as string ?? "" } as PageContent<"text">
        break
      case "choice": content = { choices: args[0] as Choice[] } as PageContent<"choice">; break
      case "skip" : content = { scene: args[0] as SceneName } as PageContent<"skip">; break
      case "phase" : content = {} as PageContent<"phase">
        break
      default :
        throw Error(`Unknown page type ${contentType}`)
    }
    this.push(createSaveState({
      contentType,
      ...content as PageContent<T>
    }))
  }

  /**
   * Creates a new page in the history. Replaces the last page if it is an empty text page
   * @param contentType type of the page to create
   * @param args content of the page, depending on {@link contentType}
   */
  onPageBreak<T extends PageType>(contentType: T, ...args: PageArgs<T>) {
    const lastPage = this.last?.page
    if (lastPage?.contentType == "text" && (lastPage as PageContent<"text">).text.length == 0)
      this.pages.pop() // remove empty text pages from history
    this.createPage(contentType, ...args)
  }

  /**
   * Remove and return the most recent element in the stack
   * @returns the removed item
   */
  pop(): SaveState | undefined {
    const page = this.pages.pop()
    if (page)
      this.onChange()
    return page
  }

  /**
   * remove the top-most n elements from the stack
   * @param quantity number of elements to remove
   */
  private trimLasts(quantity: number) {
    if (quantity > this.pages.length)
      quantity = this.pages.length
    this.pages.splice(this.pages.length - quantity)
  }

  /**
   * remove the bottom-most n elements from the stack
   * @param quantity number of elements to remove
   */
  private trimFirsts(quantity: number) {
    if (quantity > this.pages.length)
      quantity = this.pages.length
    this.pages.splice(0, quantity)
  }

  /**
   * Trims the history up to the loaded save-state. If the save-state is not
   * in the history, the history is cleared.
   * @param saveState loaded save-state.
   * @returns true if the save-state was in the history, false otherwise.
   */
  onSaveStateLoaded(saveState: SaveState): boolean {
    let i = this.pages.indexOf(saveState)
    this.trimLasts(this.pages.length - i)
    this.onChange()
    return i >= 0
  }

  /**
   * Listen for pages addition or removal.
   * @param listener callback function to register
   */
  addListener(listener: VoidFunction) {
    this.listeners.push(listener)
  }

  /**
   * Stop listening for pages addition or removal
   * @param listener callback function to unregister
   * @returns true if the callback was registered, false otherwise
   */
  removeListener(listener: VoidFunction): boolean {
    const i = this.listeners.indexOf(listener)
    if (i == -1)
      return false
    this.listeners.splice(i, 1)
    return true
  }

  /**
   * pages have been removed or added. Notify the listeners
   */
  private onChange() {
    for (const listener of this.listeners) {
      listener()
    }
  }

  /**
   * Save the history in the session storage
   */
  saveSession() {
    const jsonString = JSON.stringify(this.pages)
    sessionStorage.setItem("history", jsonString);
  }

  /**
   * restore the history from the session storage
   */
  restoreSession() {
    const saved = sessionStorage.getItem("history")
    if (saved) {
      this.pages.splice(0, this.pages.length, ...JSON.parse(saved))
      this.clean()
      this.onChange()
    }
  }

  [Symbol.iterator]() {
    return this.pages[Symbol.iterator]()
  }
}

const history = new History(HISTORY_MAX_PAGES)
history.restoreSession()

//save session when closing the tab or going to another tab
document.addEventListener("visibilitychange", ()=> {
  if (document.visibilityState == "hidden")
    history.saveSession()
})

export default history
