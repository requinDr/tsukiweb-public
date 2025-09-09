import { ScriptPlayer } from "script/ScriptPlayer";
import { LabelName } from "types";
import { InGameLayersHandler } from "./display";
import { moveBg } from "./graphics";
import { inGameKeyMap } from "./keybind";
import { QUICK_SAVE_ID, savesManager } from "./savestates";
import { settings } from "./settings";
import history, { History } from './history';
import { toast } from "react-toastify";
import { strings } from "translation/lang";
import { FaSave } from "react-icons/fa";


function quickLoad(history: History, onLoad: VoidFunction) {
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

function quickSave(history: History) {
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
}


type ShowLayers = {
	graphics: boolean,
	history: boolean,
	flowchart: boolean,
	save: boolean,
	load: boolean,
	config: boolean,
	title: boolean,

	qSave: boolean,
	qLoad: boolean,
	copyScene: boolean,
}

function createKeyMap(layers: InGameLayersHandler, show: ShowLayers) {
	const noMenu = ()=> layers.currentMenu == null
	//const noMenuWindow = ()=> ['menu', null].includes(layers.currentMenu)
	const onText = ()=> layers.topLayer == 'text'
	return {
		"next":  	[noMenu, ...inGameKeyMap['next']],
		"back":     inGameKeyMap['back'],
		"history":  [()=> show.history && onText(), ...inGameKeyMap['history']],
		"graphics": [()=> show.graphics && noMenu(), ...inGameKeyMap['graphics']],
		"bg_move":  [noMenu, ...inGameKeyMap['bg_move']],
		"auto_play":[onText, ...inGameKeyMap['auto_play']],
		"page_nav":	[noMenu, ...inGameKeyMap['page_nav']],
		"load":     [()=> show.load && noMenu(), ...inGameKeyMap['load']],
		"save":     [()=> show.save && noMenu(), ...inGameKeyMap['save']],
		"q_save":   [()=> show.qSave && noMenu(), ...inGameKeyMap['q_save']],
		"q_load":   [()=> show.qLoad && noMenu(), ...inGameKeyMap['q_load']],
		"config":   [()=> show.config && noMenu(), ...inGameKeyMap['config']],
	}
}

/*
function gameLoopGamepad(userActions: UserActionsHandler) {
	var gamepad = navigator.getGamepads()[0]; //get the first controller.
	if (gamepad && gamepad.connected) {
		var buttons = gamepad.buttons;
		for (var i in buttons) {
			if (buttons[i].pressed == true) {
				// toast("Gamepad button pressed " + i, {
				// 	autoClose: 500,
				// 	toastId: 'gp-pressed'
				// })

				switch (+i) {
					case 0: userActions.next(); break //A
					case 1: userActions.back(); break //B
					case 2: userActions.toggleMenu(); break //X
					case 3: userActions.toggleView('graphics'); break //Y
					case 4: userActions.pageNav("prev"); break //LB
					case 5: userActions.back(); break //RB
					case 6: userActions.toggleView('history'); break //LT
					case 7: userActions.pageNav("next"); break //RT
					case 8: userActions.toggleView('config'); break //Back
					case 9: userActions.toggleMenu(); break //Start
					case 10: userActions.toggleView('menu'); break //LStick
					case 11: userActions.toggleView('config'); break //RStick
					case 12: // up
						if (!isViewAnyOf("history")) {
							toggleView('history')
						}
						break
					case 13: // down
						if (isViewAnyOf("history")) {
							toggleView('history')
						}
						break
					//case 14: break //left
					case 15: next(); break // right
					default:
						break
				}
			}
		}
	}
}
*/

function swipeCallback(layers: InGameLayersHandler,
					   direction: string) {
	if (direction == "")
		return
	switch (layers.topLayer) {
		case 'text':
		case 'graphics':
			// TODO in graphics mode, move background instead of opening views ?
			switch(direction) {
				case "up" : layers.graphics = true; return true;
				case "left" : layers.menu = true; return true;
				case "right" : layers.history = true; return true;
				//case "down" : toggleView('history'); return true;
				// disabled as on android, swiping down to display the browser's menu
				// would also show the history.
			}
			break
		case 'menu':
			if (direction == "right") {
				layers.menu = false
				return true
			}
			break
		case 'history':
			if (direction == "left") {
				layers.history = false
				return true
			}
			break
	}
}

//#endregion ###################################################################
//#region                       ACTION FUNCTIONS
//##############################################################################

class UserActionsHandler {
	private _script: ScriptPlayer|null
	private _layers: InGameLayersHandler
	private _remountScript: VoidFunction

	constructor(script: ScriptPlayer|null, layers: InGameLayersHandler,
			remountScript: VoidFunction) {
		this._script = script
		this._layers = layers
		this._remountScript = remountScript
	}
	onScriptChange(script: ScriptPlayer|null) {
		this._script = script
	}

	next() {
		if (!this._script)
			return
		switch (this._layers.topLayer) {
			case 'graphics' : this._layers.text = true; break
			case 'text' :
				if (this._script.autoPlay)
					this._script.autoPlay = false
				this._script.next();
				break
		}
	}
	back() {
		if (!this._script)
			return
		if (this._script.autoPlay && !this._script.paused)
			this._script.autoPlay = false
		else {
			if (this._layers.topLayer != 'menu')
				this._layers.menu = true // open menu / go back to menu
			else
				this._layers.menu = false
		}
	}
	prevPage() {
		if (!this._script) return
		//if (this._script.autoPlay) this._script.autoPlay = false
		history.onPageLoad(history.pagesLength < 2 ? -1 : -2)
		this._remountScript()
	}
	nextPage() {
		if (!this._script) return
		if (this._script.autoPlay) this._script.autoPlay = false
		if (!this._layers.currentMenu) { // move to next page only if no menu is active
			this._layers.text = true
			const {currentLabel, currentPage} = this._script
			this._script.ffw((_l, _i, page, _lines, label: LabelName)=> {
				return page != currentPage || label != currentLabel
			}, settings.fastForwardDelay)
		}
	}
	pageNav(direction: "prev"|"next") {
		switch (direction) {
			case "prev": this.prevPage(); break
			case "next": this.nextPage(); break
		}
	}
	quickSave() {
		if (this._script?.continueScript)
			quickSave(this._script.history)
	}
	quickLoad() {
		if (this._script?.continueScript)
			quickLoad(this._script.history, this._remountScript)
	}
	handleAction(action: string, ...args: any) {
		if (!this._script)
			return
		const layers = this._layers
		switch(action) {
			case "auto_play":
				this._script.autoPlay = !this._script.autoPlay
				break
			case "next"     : this.next(); break
			case "back"     : this.back(); break
			case "page_nav" : this.pageNav(args[0]); break
			case "q_save"   : this.quickSave(); break
			case "q_load"   : this.quickLoad(); break
			case "menu"		: layers.menu     = !layers.menu; break
			case "history"  : layers.history  = !layers.history; break
			case "graphics" : layers.graphics = !layers.graphics; break
			case "load"     : layers.load     = !layers.load; break
			case "save"     : layers.save     = !layers.save; break
			case "config"   : layers.config   = !layers.config; break
			case "bg_move"  : moveBg(args[0]); break
		}
	}
}

const actions = {
	createKeyMap,
	swipeCallback,
	UserActionsHandler
}
export default actions