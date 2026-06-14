import { useEffect } from "react"
import { ScriptPlayer } from "engine/ScriptPlayer"
import { history } from 'engine/history';
import { audio, commands } from "engine/audio";
import { onAutoPlayStop, UserActionsHandler } from "features/game/utils/window-actions";
import { InGameLayersHandler, SCREEN, displayMode } from "app/utils/display";
import { useAutoPlayWakeLock } from "features/game/hooks/useAutoPlayWakeLock";

type ScriptManager = {
	script: ScriptPlayer
	history: typeof history
	layers: InGameLayersHandler
	actionsHandler: UserActionsHandler
}

const replayReturns = new WeakSet<ScriptPlayer>()

type ReplayNavigationState = {
	replayReturnTo?: SCREEN
}

export const useScriptManager = ({script, history, layers, actionsHandler}: ScriptManager) => {
	useAutoPlayWakeLock(script)

	useEffect(()=> {
		if (history.empty) displayMode.screen = SCREEN.TITLE

		actionsHandler.onScriptChange(script)
		script.setCommands(commands)

		const handleReplayEnd = () => {
			if (replayReturns.has(script))
				return
			replayReturns.add(script)
			script.stop()
			const returnScreen = (window.history.state as ReplayNavigationState|null)?.replayReturnTo
			if (returnScreen) {
				displayMode.replaceNavigation = true
				displayMode.screen = returnScreen
				return
			}
			window.history.back()
		}

		if (!script.continueScript) {
			script.addEventListener('afterBlock', handleReplayEnd)
		}

		script.addEventListener('autoPlayStop', onAutoPlayStop)
		if (!script.currentBlock) script.start()
		
		const {track, looped_se} = script.audio
		track && track.length > 0 ? audio.playGameTrack(track) : audio.stopGameTrack()
		looped_se && looped_se.length > 0 ? audio.playWave(looped_se, true) : audio.stopWave()
		
		window.script = script

		return () => {
			script.removeEventListener('afterBlock', handleReplayEnd)
			script.removeEventListener('autoPlayStop', onAutoPlayStop)
		}
	}, [script])
	
	useEffect(()=> {
		if (!script || history.empty) return
		//pause script execution when text is not the top layer
		const isTextTop = layers.topLayer === 'text'
		isTextTop ? script.resume() : script.pause()
	}, [layers.topLayer, script])
}