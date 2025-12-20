import { Fragment, useCallback, useEffect, useLayoutEffect, useReducer, useRef, useMemo } from 'react';
import * as m from "motion/react-m"
import '@styles/game.scss';
import HistoryLayer from '../layers/HistoryLayer';
import MenuLayer from '../layers/MenuLayer';
import SavesLayer from '../layers/SavesLayer';
import { HiMenu } from 'react-icons/hi';
import { InGameLayersHandler, SCREEN, displayMode } from '../utils/display';
import { commands as audioCommands, audio } from '../utils/audio';
import ConfigLayer from '../layers/ConfigLayer';
import { useSwipeGesture } from '@tsukiweb-common/input/touch';
import { useKeyMap } from '@tsukiweb-common/input/KeyMap';
import { useSetter as useReset } from '@tsukiweb-common/hooks/useSetter';
import { useDOMEvent } from '@tsukiweb-common/hooks/useDOMEvent';
import { ScriptPlayer } from 'script/ScriptPlayer';
import history from 'utils/history';
import GraphicsLayer from 'layers/GraphicsLayer';
import TextLayer from 'layers/TextLayer';
import ChoicesLayer from 'layers/ChoicesLayer';
import SkipLayer from 'layers/SkipLayer';
import { useScreenAutoNavigate, useLanguageRefresh } from 'hooks';
import { isPDScene } from 'script/utils';
import actions, { onAutoPlayStop, warnHScene } from 'utils/window-actions';
import { settings } from 'utils/settings';


const Window = () => {
	useScreenAutoNavigate(SCREEN.WINDOW)
	useLanguageRefresh()
	const rootElmtRef = useRef(null)
	const [script, remountScript] = useReset(()=>
		new ScriptPlayer(history, {
			onFinish(complete) {
				if (complete)
					displayMode.screen = SCREEN.TITLE
			}
		})
	)
	const [, onLayersChange] = useReducer(x=>x+1, 0)
	const [layers, ] = useReset(()=> new InGameLayersHandler({
		onChange: onLayersChange,
		backgroundMenu: 'remove'
	}))
	const [actionsHandler, ] = useReset(()=>
		new actions.UserActionsHandler(script, layers, remountScript))
	const topLayer = layers.topLayer

	useEffect(() => {
		remountScript()
	}, [settings.language])

	const show = useMemo(() => {
		const isPd = isPDScene(script.currentLabel ?? "")
		return {
			graphics: true,
			history: true,
			flowchart: !isPd,
			save: script.continueScript || isPd,
			load: true,
			config: true,
			title: true,
			qSave: script.continueScript || isPd,
			qLoad: script.continueScript || isPd,
			copyScene: true,
		}
	}, [script.currentLabel, script.continueScript])

	useLayoutEffect(()=> {
		if (history.empty) {
			displayMode.screen = SCREEN.TITLE
		}
	}, [])

	useEffect(()=> {
		if (history.empty)
			return
		actionsHandler.onScriptChange(script)
		script.setCommands(audioCommands)
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
			audio.playGameTrack(track)
		else
			audio.stopGameTrack()

		if (looped_se && looped_se.length > 0)
			audio.playWave(looped_se, true)
		else
			audio.stopWave()
		window.script = script
	}, [script])

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
	const _createKeyMap = useCallback(()=> actions.createKeyMap(layers, show), [layers, show])
	useKeyMap(_createKeyMap, (action, e, ...args)=>
		actionsHandler.handleAction(action, e, ...args),
		document, "keydown", { capture: false })

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

	const handleBackConfig = useCallback(() => {
		layers.back()
	}, [layers])

//............... render ...............
	return (
		<m.div
			className="page window" ref={rootElmtRef}
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{scale: 1.5, opacity: 0}}
			transition={{duration: 0.5}}
			onContextMenu={onContextMenu}>
			<Fragment key={script.uid}>
				<div className='ratio-container' onClick={()=> actionsHandler.next()}>
					<GraphicsLayer script={script} />
					<TextLayer
						script={script}
						display={layers.text && (topLayer == 'text' || topLayer == 'menu')}
						isTopLayer={topLayer == 'text'}
					/>
				</div>

				{script.continueScript && <>
					<ChoicesLayer script={script} display={layers.text} navigable={topLayer == 'text'} />
					<SkipLayer script={script} history={history} layers={layers}/>
				</>}

				<HistoryLayer
					display={layers.history || layers.flowchart}
					history={history}
					layers={layers}
					show={show}
					onRewind={remountScript} />

				<SavesLayer
					display={layers.save || layers.load}
					mode={layers.save ? 'save' : 'load'}
					back={(load)=> {
						layers.back()
						if (load) remountScript()
					}} />
				
				<ConfigLayer
					display={layers.config}
					back={handleBackConfig} />

				{layers.text &&
					<button className="menu-button"
						onClick={()=>{ layers.menu = true }}>
						<HiMenu />
					</button>
				}
				<MenuLayer
					display={layers.menu}
					show={show}
					script={script}
					layers={layers}
					qLoad={actionsHandler.quickLoad.bind(actionsHandler)}
					qSave={actionsHandler.quickSave.bind(actionsHandler)} />
			</Fragment>
		</m.div>
	)
}

export default Window
