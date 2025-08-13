import { Fragment, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import * as motion from "motion/react-m"
import '@styles/game.scss';
import HistoryLayer from '../layers/HistoryLayer';
import MenuLayer from '../layers/MenuLayer';
import SavesLayer from '../layers/SavesLayer';
import { HiMenu } from 'react-icons/hi';
import { InGameLayersHandler, SCREEN, displayMode, warnHScene } from '../utils/display';
import { commands as audioCommands, gameAudio } from '../utils/audio';
import ConfigLayer from '../layers/ConfigLayer';
import { moveBg } from '../utils/graphics';
import { useSwipeGesture } from '@tsukiweb-common/utils/touch';
import { useKeyMap } from '@tsukiweb-common/utils/KeyMap';
import { useSetter as useReset } from '@tsukiweb-common/hooks/useSetter';
import { useDOMEvent } from '@tsukiweb-common/hooks/useDOMEvent';
import { ScriptPlayer } from 'script/ScriptPlayer';
import { quickLoad, quickSave } from 'utils/savestates';
import history from 'utils/history';
import { LabelName } from 'types';
import GraphicsLayer from 'layers/GraphicsLayer';
import TextLayer from 'layers/TextLayer';
import ChoicesLayer from 'layers/ChoicesLayer';
import SkipLayer from 'layers/SkipLayer';
import { toast } from 'react-toastify';
import { settings } from 'utils/settings';
import { inGameKeyMap } from 'utils/keybind';
import { strings } from 'translation/lang';
import { MdPlayArrow } from 'react-icons/md';
import { useScreenAutoNavigate, useLanguageRefresh } from 'hooks';
import { isPDScene } from 'script/utils';

//##############################################################################
//#region                          USER INPUTS
//##############################################################################

function createKeyMap(layers: InGameLayersHandler) {
	const noMenu = ()=> layers.currentMenu == null
	//const noMenuWindow = ()=> ['menu', null].includes(layers.currentMenu)
	const onText = ()=> layers.topLayer == 'text'
	return {
		"next":  	[noMenu, ...inGameKeyMap['next']],
		"back":     inGameKeyMap['back'],
		"history":  [onText, ...inGameKeyMap['history']],
		"graphics": [noMenu, ...inGameKeyMap['graphics']],
		"bg_move":  [noMenu, ...inGameKeyMap['bg_move']],
		"auto_play":[onText, ...inGameKeyMap['auto_play']],
		"page_nav":	[noMenu, ...inGameKeyMap['page_nav']],
		"load":     [noMenu, ...inGameKeyMap['load']],
		"save":     [noMenu, ...inGameKeyMap['save']],
		"q_save":   [noMenu, ...inGameKeyMap['q_save']],
		"q_load":   [noMenu, ...inGameKeyMap['q_load']],
		"config":   [noMenu, ...inGameKeyMap['config']],
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
		case 'text' : case 'graphics' :
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
		case 'menu' :
			if (direction == "right") {
				layers.menu = false
				return true
			}
			break
		case 'history' :
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

//#endregion ###################################################################
//#region                           COMPONENT
//##############################################################################

function onAutoPlayStop(ffw: boolean) {
	if (ffw) {
		//console.log("ffw stop")
		//toast("Fast-Forward stopped", {
		//	autoClose: 600,
		//	toastId: 'ff-stop'
		//})
	} else {
		toast(strings.game['toast-autoplay-stop'], {
			autoClose: 600,
			toastId: 'ap-stop',
			hideProgressBar: true,
			icon: () => <MdPlayArrow />,
		})
	}
}

const Window = () => {
	useScreenAutoNavigate(SCREEN.WINDOW)
	useLanguageRefresh()
	const rootElmtRef = useRef(null)
	const [script, remountScript] = useReset(()=> new ScriptPlayer(history))
	const [, onLayersChange] = useReducer(x=>x+1, 0)
	const [layers, ] = useReset(()=> new InGameLayersHandler({
		onChange: onLayersChange,
		backgroundMenu: 'remove'
	}))
	const [actionsHandler, ] = useReset(()=>
		new UserActionsHandler(script, layers, remountScript))
	const [textboxStyle, setTextboxStyle] = useState<'adv' | 'nvl'>(isPDScene(script.currentLabel ?? "") ? "adv" : "nvl");

	useMemo(()=> {
		if (history.empty) {
			setTimeout(()=> {
				displayMode.screen = SCREEN.TITLE
			}, 0)
		}
	}, [])
	
	useEffect(()=> {
		if (history.empty)
			return
		actionsHandler.onScriptChange(script)
		script.setCommands(audioCommands)
		script.setCommand('textbox', (arg: string) => {
			if (arg === 'adv' || arg === 'nvl') {
				setTextboxStyle(arg as 'adv' | 'nvl');
			}
		})
		script.setBlockStartCallback(warnHScene)
		if (!script.continueScript) {
			script.setAfterBlockCallback(()=> {
				//console.log("scene ended, return to previous page")
				script.stop()
				window.history.back()
			})
		}
		script.setAutoPlayStopCallback(onAutoPlayStop)
		if (!script.currentBlock) {
			//console.debug("starting script")
			script.start()
		}
		const {track, looped_se} = script.audio
		if (track && track.length > 0)
			gameAudio.track.play(track)
		else
			gameAudio.track.stop()
		
		if (looped_se && looped_se.length > 0)
			gameAudio.se.play(looped_se)
		else
			gameAudio.se.stop()
		window.script = script
	}, [script])

	const topLayer = layers.topLayer

	useEffect(()=> {
		if (history.empty)
			return
		//pause script execution when text is not the top layer
		if (script) {
			if (script.paused) {
				if (topLayer == 'text')
					script.resume()
			} else {
				if (topLayer != 'text')
					script.pause()
			}
		}
	}, [topLayer])
	

	// ref so it doesn't change once leaving a context until component unmount
	const show = useRef({
		graphics: true,
		history: true,
		flowchart: true,
		save: true,
		load: true,
		config: true,
		title: true,

		qSave: true,
		qLoad: true,
		copyScene: true,
	})

//............ user inputs .............
	const _createKeyMap = useCallback(()=> createKeyMap(layers), [])
	useKeyMap(_createKeyMap, (action, _evt, ...args)=>
		actionsHandler.handleAction(action, ...args),
	document, "keydown", {capture: false})

//	useGamepad({fct: gameLoopGamepad.bind(null, actionsHandler.current!)})

	useSwipeGesture(swipeCallback.bind(null, layers),
		rootElmtRef, 50)
	
	useDOMEvent((e: WheelEvent)=> {
		if (e.ctrlKey)
			return
		const topLayer = layers.topLayer
		if (e.deltaY < 0 && ['text', 'graphics'].includes(topLayer)) {
			layers.history = true
		}
	}, window, 'wheel')

	const onContextMenu = (e: React.MouseEvent<HTMLElement>) => {
		e.preventDefault()
		const isTouchDevice = window.matchMedia("(pointer: coarse)").matches
		if (isTouchDevice) return
		
		actionsHandler.back()
	}

//............... render ...............
	return (
		<motion.div
			className="page window" ref={rootElmtRef}
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{scale: 1.5, opacity: 0}}
			transition={{duration: 0.5}}
			onContextMenu={onContextMenu}>
			<Fragment key={script.uid}>
				<div className='ratio-container' onClick={()=> actionsHandler.next()}>
					<GraphicsLayer script={script} />
					<TextLayer script={script} display={layers.text && 'auto'} textbox={textboxStyle} />
				</div>

				{script.continueScript && <>
					<ChoicesLayer script={script} display={layers.text}/>
					<SkipLayer script={script} history={history} display={layers.text}/>
				</>}

				<HistoryLayer
					display={layers.history || layers.flowchart}
					history={history}
					layers={layers}
					onRewind={remountScript}/>
					
				<SavesLayer
					display={layers.save || layers.load}
					mode={layers.save ? 'save' : 'load'}
					back={(load)=> {
						layers.back()
						if (load) remountScript()
					}} />
				
				<ConfigLayer display={layers.config} back={layers.back.bind(layers)} />

				{layers.text &&
					<button className="menu-button"
						onClick={()=>{ layers.menu = true }}>
						<HiMenu />
					</button>
				}
				<MenuLayer show={show.current} script={script} layers={layers}
					qLoad={actionsHandler.quickLoad.bind(actionsHandler)}
					qSave={actionsHandler.quickSave.bind(actionsHandler)}/>
			</Fragment>
		</motion.div>
	)
}

export default Window;

//#endregion
//##############################################################################
