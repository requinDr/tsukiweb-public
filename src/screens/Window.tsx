import { useEffect, useRef } from 'react';
import * as motion from "motion/react-m"
import '../styles/game.scss';
import HistoryLayer from '../layers/HistoryLayer';
import ChoicesLayer from '../layers/ChoicesLayer';
import MenuLayer from '../layers/MenuLayer';
import TextLayer from '../layers/TextLayer';
import GraphicsLayer from '../layers/GraphicsLayer';
import { inGameKeymap } from '../utils/KeyMap';
import script from '../utils/script';
import { gameContext, gameSession } from '../utils/variables';
import { quickSave, quickLoad, loadSaveState } from "../utils/savestates";
import SkipLayer from '../layers/SkipLayer';
import SavesLayer from '../layers/SavesLayer';
import history from '../utils/history';
import { HiMenu } from 'react-icons/hi';
import { toast } from 'react-toastify';
import { SCREEN, displayMode, isViewAnyOf } from '../utils/display';
import ConfigLayer from '../layers/ConfigLayer';
import { moveBg } from '../utils/graphics';
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh';
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate';
import { KeysMatching } from '@tsukiweb-common/types';
import useGamepad from '@tsukiweb-common/hooks/useGamepad';
import GestureHandler from '@tsukiweb-common/utils/touch';
import { useObserved } from '@tsukiweb-common/utils/Observer';
import KeyMap from '@tsukiweb-common/utils/KeyMap';

//##############################################################################
//#                                USER INPUTS                                 #
//##############################################################################

const keyMap = new KeyMap(inGameKeymap, (action, evt, ...args)=> {
	switch(action) {
		case "next"     : next(); break
		case "back"     : back(); break
		case "auto_play": script.autoPlay = !script.autoPlay; break
		case "page_nav" : page_nav(args[0], evt); break
		case "history"  : toggleView('history'); break
		case "graphics" : toggleView('graphics'); break
		case "load"     : gameSession.continueScript && toggleView('load'); break
		case "save"     : gameSession.continueScript && toggleView('save'); break
		case "config"   : toggleView('config'); break
		case "q_save"   : gameSession.continueScript && quickSave(); break
		case "q_load"   : gameSession.continueScript && quickLoad(); break
		case "bg_move"  : moveBg(args[0]); break
	}
})

const gestures = new GestureHandler(null, {
	swipeTrigDistance: 50, onSwipe: (direction)=> {
		if (direction == "")
			return
		if (isViewAnyOf("text", "graphics", "dialog")) {
			// TODO in graphics mode, move background instead of opening views ?
			switch(direction) {
				case "up" : toggleView('graphics'); return true;
				case "left" : toggleView('menu'); return true;
				case "right" : toggleView('history'); return true;
				//case "down" : toggleView('history'); return true;
				// disabled as on android, swiping down to display the browser's menu
				// would also show the history.
			}
		} else if (isViewAnyOf("menu")) {
			if (direction == "right") {
				back()
				return true
			}
		} else if (isViewAnyOf("history")) {
			if (direction == "left") {
				back()
				return true
			}
		}
	}
})

function gameLoopGamepad() {
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
					case 0: next(); break //A
					case 1: back(); break //B
					case 2: toggleMenu(); break //X
					case 3: toggleView('graphics'); break //Y
					case 4: page_nav("prev"); break //LB
					case 5: back(); break //RB
					case 6: toggleView('history'); break //LT
					case 7: page_nav("next"); break //RT
					case 8: toggleView('config'); break //Back
					case 9: toggleMenu(); break //Start
					case 10: toggleView('menu'); break //LStick
					case 11: toggleView('config'); break //RStick
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
					case 15: next(); break
					default:
						break
				}
			}
		}
	}
}

//##############################################################################
//#                              ACTION FUNCTIONS                              #
//##############################################################################

function toggleView(v: KeysMatching<typeof displayMode, boolean>) {
	stopAutoPlay()
	displayMode[v] = !displayMode[v]
}

function stopAutoPlay(displayToast=true) {
	let result = false
	if (script.autoPlay) {
		script.autoPlay = false
		if (displayToast)
			toast("Auto-play stopped", {
				autoClose: 500,
				toastId: 'ap-stop'
			})
		result = true
	}
	if (script.isFastForward) {
		script.fastForward(undefined)
		if (displayToast)
			toast("Fast-Forward stopped", {
				autoClose: 500,
				toastId: 'ff-stop'
			})
		result = true
	}
	return result
}

function back() {
	stopAutoPlay()
	switch (displayMode.currentView) {
		case "saves"    : displayMode.saveScreen = false; break
		case "config"   : displayMode.config = false; break
		case "history"  : displayMode.history = false; break
		case "menu"     : displayMode.menu = false; break;
		case "graphics" : // open the menu if the current view is texts,
		case "dialog"   : // graphics or dialog
		case "text"     : displayMode.menu = true; break
		default : console.error(`cannot exit unknown view "${displayMode.currentView}"`)
	}
}

function manuallyDisabledGraphics() {
	return script.isCurrentLineText() ||
				 script.currentLine?.startsWith("select") ||
				 //script.currentLine?.startsWith("osiete") || TODO uncomment if necessary, or remove
				 script.currentLine?.match(/gosub\s+\*(?!(left|right))/)
}

function next() {
	if (isViewAnyOf("text", "graphics")) {
		if (displayMode.currentView == "graphics" && manuallyDisabledGraphics()) // text has been hidden manually
			displayMode.graphics = false
		else if (!stopAutoPlay())
			script.next()
	}
}

function page_nav(direction: "prev"|"next", event?: KeyboardEvent) {
	stopAutoPlay(!(event?.repeat))
	switch (direction) {
		case "prev":
			let ss = history.get(history.length < 2 ? -1 : -2)
			if (ss)
				loadSaveState(ss)
			break
		case "next":
			if (!script.isFastForward && isViewAnyOf("text", "graphics")) {
				const currLabel = gameContext.label
				script.fastForward((_l, _i, label)=>{
					return script.getOffsetLine(-1)?.startsWith('\\')
							|| label != currLabel
				})
			}
			break;
	}
}

function toggleMenu() {
	displayMode.menu = !displayMode.menu
	//focus menu-container if the menu is open
	if (displayMode.menu) {
		setTimeout(()=> {
			const menuContainer = document.getElementById("menu-container")
			if (menuContainer)
				menuContainer.focus()
		}, 100)
	}
	stopAutoPlay()
}

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

const Window = () => {
	useScreenAutoNavigate(SCREEN.WINDOW)
	useLanguageRefresh()
	const rootElmtRef = useRef(null)
	const [hideMenuBtn] = useObserved(displayMode, "graphics")

	// ref so it doesn't change once leaving a context until component unmount
	const show = useRef({
		graphics: true,
		history: true,
		save: gameSession.continueScript,
		load: gameSession.continueScript,
		config: true,
		title: true,

		qSave: gameSession.continueScript,
		qLoad: gameSession.continueScript,
		copyScene: true,
	})

	useEffect(()=> {
		//TODO wait for screen transition animation to end before starting the script
		if (gameContext.label == '') {
			setTimeout(()=> {
				if (gameContext.label != '')
					return
				if (!history.empty)
					loadSaveState(history.last)
				else
					script.moveTo('openning')
			}, 100)
		}
	}, [])

//............ user inputs .............
	useGamepad({fct: gameLoopGamepad})

	useEffect(()=> {
		if (rootElmtRef.current) {
			gestures.enable(rootElmtRef.current)
			return gestures.disable.bind(gestures)
		}
	}, [rootElmtRef])

	useEffect(()=> {
		keyMap.enable(document, "keydown", {
			capture: false // default if bubble. set to true to change to capture
		})
		return keyMap.disable.bind(keyMap, document, "keydown")
	}, [])

	const onContextMenu = (e: React.MouseEvent<HTMLElement>) => {
		e.preventDefault()
		const isTouchDevice = window.matchMedia("(pointer: coarse)").matches
		if (isTouchDevice) return
		
		back()
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
			<div className='ratio-container'>
				<GraphicsLayer onClick={next} />

				<TextLayer onClick={next}/>
			</div>

			<ChoicesLayer />

			<HistoryLayer />

			{(show.current.save || show.current.load) &&
			<SavesLayer
				back={() => {
					displayMode.save = false
					displayMode.load = false
				}} />
			}

			<ConfigLayer back={() => displayMode.config = false} />

			<SkipLayer />

			{!hideMenuBtn &&
				<button className="menu-button" onClick={toggleMenu}>
					<HiMenu />
				</button>
			}
			<MenuLayer show={show.current} />
		</motion.div>
	)
}

export default Window;
