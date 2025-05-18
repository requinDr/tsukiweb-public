import { notifyObservers, observe, simulateObserverChange as triggerObservers } from "@tsukiweb-common/utils/Observer";
import { toast } from "react-toastify";
import { isThScene } from "script/utils";
import { strings } from "translation/lang";
import { LabelName } from "types";
import { SCENE_ATTRS } from "./constants";
import { settings } from "./settings";

export enum SCREEN {
  TITLE = "/",
  WINDOW = "/window",
  CONFIG = "/config",
  LOAD = "/load",
  GALLERY = "/gallery",
  ENDINGS = "/endings",
  SCENES = "/scenes",
  PLUS_DISC = "/plus-disc",
}

export const displayMode: { [key: string]: any } = {
  screen: undefined,
  bgAlignment: 'center' as ('top' | 'center' | 'bottom'),
}

type InGameMenu = 'history' | 'flowchart' | 'save' | 'load' | 'config'

type LayersOptions = {
  /**
   * * `keep`  : the menu stays active when another menu is enabled
   * * `remove`: the menu is removed when another menu is enabled
   * * `hide`  : the menu is removed when another menu is enabled,
   * 			   but restored when it is disabled
   */
  backgroundMenu?: 'keep' | 'hide' | 'remove'
  onChange?: VoidFunction
}

export class InGameLayersHandler {
  private _text: boolean = true
  private _menu: boolean = false
  private _currentMenu: InGameMenu|null = null

  private _backgroundMenu: 'keep' | 'hide' | 'remove'
  private _onChange: ((layers: InGameLayersHandler)=>void)|VoidFunction|undefined

  constructor({backgroundMenu = 'remove', onChange}: LayersOptions = {}) {
    this._backgroundMenu = backgroundMenu
    this._onChange = onChange
  }
  get text() { return this._text }
  set text(value: boolean) {
    if (value != this._text) {
      this._text = value
      this._currentMenu = null
      this._menu = false
      this._onChange?.(this)
    }
  }
  get graphics() { return !this._text }
  set graphics(value: boolean) { this.text = !value }

  get menu() {
    if (!this._menu) return false
    if (!this._currentMenu) return true
    if (this._backgroundMenu != 'keep') return false
    return true
  }
  set menu(value: boolean) {
    if (value != this.menu) {
      this._menu = value
      this._currentMenu = null
      if (value == this.menu)
        this._onChange?.(this)
    }
  }
  get history() { return this._currentMenu == 'history' }
  set history(value: boolean) { this._setMenu('history', value) }

  get flowchart() { return this._currentMenu == 'flowchart' }
  set flowchart(value: boolean) { this._setMenu('flowchart', value) }

  get save() { return this._currentMenu == 'save' }
  set save(value: boolean) { this._setMenu('save', value) }

  get load() { return this._currentMenu == 'load' }
  set load(value: boolean) { this._setMenu('load', value) }

  get config() { return this._currentMenu == 'config' }
  set config(value: boolean) { this._setMenu('config', value) }

  get currentMenu() {
    if (this._currentMenu)
      return this._currentMenu
    if (this._menu)
      return 'menu'
    return null
  }

  get topLayer() {
    if (this._currentMenu)
      return this._currentMenu
    else if (this._menu)
      return 'menu'
    else if (this._text)
      return 'text'
    else
      return 'graphics'
  }

  private _setMenu(menu: InGameMenu, open: boolean) {
    if (open) {
      if (this._currentMenu != menu) {
        if (this.menu && this._backgroundMenu == 'remove')
          this.menu = false
        this._currentMenu = menu
        this._onChange?.(this)
      }
    } else if (this._currentMenu == menu) {
      this.exitCurrentMenu()
    }
  }
  exitCurrentMenu() {
    if (this._currentMenu){
      this._currentMenu = null
      this._onChange?.(this)
    }
  }
  back() {
    if (this._currentMenu)
      this.exitCurrentMenu()
    else {
      this.menu = !this.menu
    }
  }
}

export function warnHScene(label?: LabelName) {
	if (!label || (isThScene(label) && settings.warnHScenes
		&& SCENE_ATTRS.scenes[label]?.h)) {
		toast(strings.game["toast-hscene-waning"], {
			toastId: "hscene-warning",
			autoClose: 4000
		});
	}
}


//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.displayMode = displayMode
