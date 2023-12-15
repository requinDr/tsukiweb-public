
import { useNavigate } from "react-router-dom";
import { notifyObservers, observe, unobserve } from "./Observer";
import { useEffect } from "react";

export enum SCREEN {
  TITLE = "/title",
  WINDOW = "/window",
  CONFIG = "/config",
  LOAD = "/load",
  EXTRA = "/extra",
  GALLERY = "/extra/gallery",
  ENDINGS = "/extra/endings",
  SCENES = "/extra/scenes"
}

let history: boolean = false;
let text: boolean = true;
let skip: boolean = false;
let choice: boolean = false;
let graphics: boolean = false;
let savesVariant: 'save'|'load'|'' = '';
let config: boolean = false;

export const displayMode: { [key: string]: any } = {
  screen: SCREEN.TITLE,
  menu: false as boolean,
  bgAlignment: 'center' as ('top' | 'center' | 'bottom'),

  get text() { return text },
  set text(v) {
    if (v != text) {
      text = v
      if (v && this.history)
        this.history = false
    }
  },

  get history() { return history },
  set history(v) {
    if (v != history) {
      history = v
      if (v == this.text) { // showing the history hides the text,
        this.text = !v      // and hiding the history shows the text
        //this.dialog = !v // also hide/show the dialogs if any
      }
    }
  },

  get skip() { return skip },
  set skip(v) {
    if (v != skip) {
      const prevDialog = this.dialog
      skip = v
      if (prevDialog != this.dialog)
        notifyObservers(this, 'dialog')
    }
  },

  get choice() { return choice },
  set choice(v) {
    if (v != choice) {
      const prevDialog = this.dialog
      choice = v
      if (prevDialog != this.dialog)
        notifyObservers(this, 'dialog')
    }
  },

  get dialog(): boolean { return skip || choice },
  set dialog(v: boolean) {
    if (v != this.dialog) {
      this.skip = v    // if true and nothing to show,
      this.choice = v  // their handler will reset them to false
    }
  },

  get save() { return savesVariant == 'save' },
  set save(v) {
    if (v != this.save) {
      const notifyLoad = this.load
      savesVariant = v ? 'save' : ''
      if (notifyLoad)
        notifyObservers(this, 'load')
      notifyObservers(this, 'saveScreen')
    }
  },

  get load() { return savesVariant == 'load' },
  set load(v) {
    if (v != this.load) {
      const notifySave = this.save
      savesVariant = v ? 'load' : ''
      if (notifySave)
        notifyObservers(this, 'save')
      notifyObservers(this, 'saveScreen')
    }
  },

  get saveScreen():boolean { return savesVariant != '' },
  set saveScreen(v: false) {
    if (v != (this.saveScreen)) {
      if (v)
        throw Error("saveScreen cannot be set to true manually."+
                    " Use 'save' or 'load' instead.")
      const prevSave = this.save
      savesVariant = ''
      notifyObservers(this, prevSave ? 'save' : 'load')
    }
  },

  get savesVariant() { return savesVariant },

  get config() { return config },
  set config(v: boolean) {
    if (v != config) {
      config = v
      if (v) {
        this.dialog = false
        this.text = false
        this.history = false
        this.saveScreen = false
      } else {
        this.text = true
        this.dialog = true
      }
    }
  },

  get graphics() { return graphics },
  set graphics(v: boolean) {
    if (v != graphics) {
      graphics = v
      if (v) {
        this.dialog = false
        this.text = false
        this.history = false
        this.saveScreen = false
      } else {
        this.text = true
        this.dialog = true
      }
    }
  },

  get currentView() { // not observable
    if (this.saveScreen)
      return "saves"
    else if (this.config)
      return "config"
    else if (this.menu)
      return "menu"
    else if (this.history)
      return "history"
    else if (this.dialog)
      return "dialog"
    else if (this.text)
      return "text"
    else if (this.graphics)
      return "graphics"
    else
      throw Error("Could not determine current view")
  }
}

function updateGraphics() {
  displayMode.graphics = !(text || choice || skip || history || (savesVariant!=''))
}

observe(displayMode, 'dialog', updateGraphics)
observe(displayMode, 'history', updateGraphics)
observe(displayMode, 'text', updateGraphics)
observe(displayMode, 'saveScreen', updateGraphics)

function hideMenuOnActive(d: boolean) {
  if (d)
    displayMode.menu = false
}

observe(displayMode, "saveScreen", hideMenuOnActive)
observe(displayMode, "history", hideMenuOnActive)
observe(displayMode, "graphics", hideMenuOnActive)
observe(displayMode, "screen", (screen)=> {
  if (screen != SCREEN.WINDOW) {
    displayMode.history = false
    displayMode.text = false
    displayMode.dialog = false
    displayMode.saveScreen = false
    displayMode.menu = false
    displayMode.config = false
  }
})

export function isViewAnyOf(...views: Array<typeof displayMode.currentView>) {
  return views.includes(displayMode.currentView)
}

export function useScreenAutoNavigate(currentScreen: SCREEN) {
  const navigate = useNavigate()
  useEffect(()=> {
    displayMode.screen = currentScreen
    observe(displayMode, 'screen', navigate,
        { filter: (s)=> s != currentScreen })
    return unobserve.bind(null, displayMode, 'screen', navigate) as VoidFunction
  }, [])
}


//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.displayMode = displayMode