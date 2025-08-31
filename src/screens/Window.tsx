import { Fragment, useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import * as motion from "motion/react-m"
import '@styles/game.scss';
import HistoryLayer from '../layers/HistoryLayer';
import MenuLayer from '../layers/MenuLayer';
import SavesLayer from '../layers/SavesLayer';
import { HiMenu } from 'react-icons/hi';
import { InGameLayersHandler, SCREEN, displayMode, warnHScene } from '../utils/display';
import { commands as audioCommands, gameAudio } from '../utils/audio';
import ConfigLayer from '../layers/ConfigLayer';
import { useSwipeGesture } from '@tsukiweb-common/utils/touch';
import { useKeyMap } from '@tsukiweb-common/utils/KeyMap';
import { useSetter as useReset } from '@tsukiweb-common/hooks/useSetter';
import { useDOMEvent } from '@tsukiweb-common/hooks/useDOMEvent';
import { ScriptPlayer } from 'script/ScriptPlayer';
import history from 'utils/history';
import GraphicsLayer from 'layers/GraphicsLayer';
import TextLayer from 'layers/TextLayer';
import ChoicesLayer from 'layers/ChoicesLayer';
import SkipLayer from 'layers/SkipLayer';
import { toast } from 'react-toastify';
import { strings } from 'translation/lang';
import { MdPlayArrow } from 'react-icons/md';
import { useScreenAutoNavigate, useLanguageRefresh } from 'hooks';
import { isPDScene } from 'script/utils';
import actions from 'utils/window-actions';


function onAutoPlayStop(ffw: boolean) {
	if (!ffw) {
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
		new actions.UserActionsHandler(script, layers, remountScript))
	const [textboxStyle, setTextboxStyle] = useState<'adv' | 'nvl'>("nvl")

	// ref so it doesn't change once leaving a context until component unmount
	const show = useRef({
		graphics: true,
		history: true,
		flowchart: !isPDScene(script.currentLabel ?? ""),
		save: script.continueScript,
		load: true,
		config: true,
		title: true,

		qSave: script.continueScript,
		qLoad: script.continueScript,
		copyScene: true,
	})

	useLayoutEffect(()=> {
		if (history.empty) {
			displayMode.screen = SCREEN.TITLE
		}
	}, [])

	useLayoutEffect(() => {
		const isPd = isPDScene(script.currentLabel ?? "")
		show.current.flowchart = !isPd
		show.current.save = script.continueScript || isPd
		show.current.qSave = script.continueScript || isPd
		show.current.qLoad = script.continueScript || isPd
	}, [script.continueScript, script.currentLabel])

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
			gameAudio.track.play(track, {loop: true})
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

//............ user inputs .............
	const _createKeyMap = useCallback(()=> actions.createKeyMap(layers, show.current), [])
	useKeyMap(_createKeyMap, (action, _evt, ...args)=>
		actionsHandler.handleAction(action, ...args),
	document, "keydown", {capture: false})

	// useGamepad({fct: gameLoopGamepad.bind(null, actionsHandler.current!)})

	useSwipeGesture(actions.swipeCallback.bind(null, layers),
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
					show={show.current}
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
