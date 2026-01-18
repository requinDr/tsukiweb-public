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
import { useSetter as useReset } from '@tsukiweb-common/hooks';
import { useDOMEvent } from '@tsukiweb-common/hooks/useDOMEvent';
import { ScriptPlayer } from 'script/ScriptPlayer';
import history from 'script/history';
import GraphicsLayer from 'layers/GraphicsLayer';
import TextLayer from 'layers/TextLayer';
import ChoicesLayer from 'layers/ChoicesLayer';
import SkipLayer from 'layers/SkipLayer';
import { useScreenAutoNavigate } from 'hooks';
import { isPDScene } from 'script/utils';
import actions, { onAutoPlayStop, warnHScene } from 'utils/window-actions';
import { settings } from 'utils/settings';
import { useObserver } from '@tsukiweb-common/utils/Observer';


const Window = () => {
	useScreenAutoNavigate(SCREEN.WINDOW)
	const rootElmtRef = useRef(null)
	const [script, remountScript] = useReset(()=> {
		const script = new ScriptPlayer(history)
		script.addEventListener('finish', (complete)=> {
			if (complete) displayMode.screen = SCREEN.TITLE
		})
		return script
	})
	const [, onLayersChange] = useReducer(x=>x+1, 0)
	const [layers, ] = useReset(()=> new InGameLayersHandler({
		onChange: onLayersChange,
		backgroundMenu: 'remove'
	}))
	const [actionsHandler, ] = useReset(()=>
		new actions.UserActionsHandler(script, layers, remountScript))
	const topLayer = layers.topLayer

	useObserver(remountScript, settings, 'language', { skipFirst: true })

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

	useEffect(()=> {
		if (history.empty)
			displayMode.screen = SCREEN.TITLE
		actionsHandler.onScriptChange(script)
		script.setCommands(audioCommands)
		script.addEventListener('blockStart', warnHScene)
		if (!script.continueScript) {
			script.addEventListener('afterBlock', ()=> {
				//console.log("scene ended, return to previous page")
				script.stop()
				window.history.back()
			})
		}
		script.addEventListener('autoPlayStop', onAutoPlayStop)
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
		} else if (e.deltaY > 0 && topLayer === 'text') {
			actionsHandler.next()
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
			exit={{opacity: 0}}
			transition={{duration: 0.3}}
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
					mode={layers.save ? 'save' : layers.load ? 'load' : null}
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
