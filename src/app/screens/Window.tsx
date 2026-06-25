import { Fragment, useCallback, useRef, useMemo, useSyncExternalStore } from 'react';
import * as m from "motion/react-m"
import '@features/game/styles/game.scss';
import { HiMenu } from 'react-icons/hi';
import { useDefaultNavBack, useResettable } from '@tsukiweb-common/hooks';
import { ScriptPlayer } from 'engine/ScriptPlayer';
import { history } from 'engine/history';
import { isPDScene } from 'engine/utils';
import actions, { ShowLayers } from 'features/game/utils/window-actions';
import { settings } from 'engine/settings';
import { useObserver } from '@tsukiweb-common/utils/Observer';
import { RatioContainer } from '@tsukiweb-common/ui-core';
import MenuLayer from 'features/game/components/layers/MenuLayer';
import SavesLayer from 'features/game/components/layers/SavesLayer';
import SkipLayer from 'features/game/components/layers/SkipLayer';
import { useGameInputs } from 'features/game/hooks/useGameInputs';
import { useScriptManager } from 'features/game/hooks/useScriptManager';
import GraphicsLayer from 'features/game/components/layers/GraphicsLayer';
import ChoicesLayer from 'features/game/components/layers/ChoicesLayer';
import ConfigLayer from 'features/game/components/layers/ConfigLayer';
import HistoryLayer from 'features/game/components/layers/HistoryLayer';
import TextLayer from 'features/game/components/layers/TextLayer';
import { SCREEN, displayMode } from 'app/utils/display';
import { useScreenAutoNavigate } from 'app/hooks';
import { InGameLayersHandler } from "@tsukiweb-common/utils/InGameLayersHandler";


const Window = () => {
	useScreenAutoNavigate(SCREEN.WINDOW)
	useDefaultNavBack(()=>actionsHandler.back())
	const rootRef = useRef(null)

	const [script, remountScript] = useResettable(()=> {
		const s = new ScriptPlayer(history)
		s.addEventListener('finish', (complete) => {
			if (complete) displayMode.screen = SCREEN.TITLE
		})
		if (s.graphics.bgAlign)
			displayMode.bgAlignment = s.graphics.bgAlign
		return s
	})

	const [layers] = useResettable(()=> new InGameLayersHandler({
		backgroundMenu: 'remove'
	}))
	useSyncExternalStore(layers.subscribe, layers.getSnapshot)
	const [actionsHandler] = useResettable(()=>
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
			transition={{duration: 0.3}}>
			<Fragment key={script.uid}>
				<RatioContainer obj={settings} onClick={()=> actionsHandler.next()}>
					<GraphicsLayer script={script} />
					<TextLayer
						script={script}
						display={layers.text && (topLayer == 'text' || topLayer == 'menu')}
						isTopLayer={topLayer == 'text'}
					/>
				</RatioContainer>

				{script.continueScript &&
					<ChoicesLayer
						script={script}
						display={layers.text && (topLayer == 'text' || topLayer == 'menu')}
						navigable={topLayer == 'text'}
					/>
				}
				<SkipLayer script={script} history={history} layers={layers}/>

				<HistoryLayer
					display={layers.history || layers.flowchart}
					history={history}
					layers={layers}
					continueScript={script.continueScript}
					show={show}
					onRewind={remountScript}
				/>
			</Fragment>

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
		</m.div>
	)
}

export default Window
