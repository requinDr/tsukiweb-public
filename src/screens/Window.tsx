import { Fragment, useCallback, useReducer, useRef, useMemo } from 'react';
import * as m from "motion/react-m"
import '@styles/game.scss';
import HistoryLayer from '../layers/HistoryLayer';
import MenuLayer from '../layers/MenuLayer';
import SavesLayer from '../layers/SavesLayer';
import { HiMenu } from 'react-icons/hi';
import { InGameLayersHandler, SCREEN, displayMode } from '../utils/display';
import ConfigLayer from '../layers/ConfigLayer';
import { useSetter as useReset } from '@tsukiweb-common/hooks';
import { ScriptPlayer } from 'script/ScriptPlayer';
import history from 'script/history';
import GraphicsLayer from 'layers/GraphicsLayer';
import TextLayer from 'layers/TextLayer';
import ChoicesLayer from 'layers/ChoicesLayer';
import SkipLayer from 'layers/SkipLayer';
import { useGameInputs, useScreenAutoNavigate, useScriptManager } from 'hooks';
import { isPDScene } from 'script/utils';
import actions, { ShowLayers } from 'utils/window-actions';
import { settings } from 'utils/settings';
import { useObserver } from '@tsukiweb-common/utils/Observer';
import { RatioContainer } from '@tsukiweb-common/ui-core';


const Window = () => {
	useScreenAutoNavigate(SCREEN.WINDOW)
	const rootRef = useRef(null)

	const [script, remountScript] = useReset(()=> {
		const s = new ScriptPlayer(history)
		s.addEventListener('finish', (complete) => {
			if (complete) displayMode.screen = SCREEN.TITLE
		})
		if (s.graphics.bgAlign)
			displayMode.bgAlignment = s.graphics.bgAlign
		return s
	})

	const [, onLayersChange] = useReducer(x => x + 1, 0)
	const [layers] = useReset(()=> new InGameLayersHandler({
		onChange: onLayersChange,
		backgroundMenu: 'remove'
	}))
	const [actionsHandler] = useReset(()=>
		new actions.UserActionsHandler(script, layers, remountScript)
	)

	useObserver(remountScript, settings, 'language', { skipFirst: true })

	const show: ShowLayers = useMemo(() => {
		const isPd = isPDScene(script.currentLabel ?? "")
		const canSave = script.continueScript || isPd
		return {
			graphics: true,
			history: true,
			flowchart: !isPd,
			save: canSave,
			load: true,
			config: true,
			title: true,
			qSave: canSave,
			qLoad: canSave,
			copyScene: true,
		}
	}, [script.currentLabel, script.continueScript])

	useScriptManager({script, history, layers, actionsHandler})
	useGameInputs({rootRef, layers, actionsHandler, show})

	const onContextMenu = (e: React.MouseEvent<HTMLElement>) => {
		e.preventDefault()
		if (!window.matchMedia("(pointer: coarse)").matches)
			actionsHandler.back()
	}

	const handleBackConfig = useCallback(() => {
		layers.back()
	}, [layers])

	const topLayer = layers.topLayer

	return (
		<m.div
			className="page window" ref={rootRef}
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}
			transition={{duration: 0.3}}
			onContextMenu={onContextMenu}>
			<Fragment key={script.uid}>
				<RatioContainer obj={settings} onClick={()=> actionsHandler.next()}>
					<GraphicsLayer script={script} />
					<TextLayer
						script={script}
						display={layers.text && (topLayer == 'text' || topLayer == 'menu')}
						isTopLayer={topLayer == 'text'}
					/>
				</RatioContainer>

				{script.continueScript && <>
					<ChoicesLayer script={script} display={layers.text} navigable={topLayer == 'text'} />
					<SkipLayer script={script} history={history} layers={layers}/>
				</>}

				<HistoryLayer
					display={layers.history || layers.flowchart}
					history={history}
					layers={layers}
					show={show}
					onRewind={remountScript}
				/>

				<SavesLayer
					mode={layers.save ? 'save' : layers.load ? 'load' : null}
					onBack={load => {
						layers.back()
						if (load) remountScript()
					}}
				/>
				
				<ConfigLayer
					display={layers.config}
					onBack={handleBackConfig}
				/>

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
					qSave={actionsHandler.quickSave.bind(actionsHandler)}
				/>
			</Fragment>
		</m.div>
	)
}

export default Window
