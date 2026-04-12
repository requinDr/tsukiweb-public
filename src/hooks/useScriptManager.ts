import { useEffect } from "react"
import { ScriptPlayer } from "script/ScriptPlayer"
import history from 'script/history';
import { audio, commands } from "utils/audio";
import { displayMode, InGameLayersHandler, SCREEN } from "utils/display";
import { onAutoPlayStop, UserActionsHandler } from "utils/window-actions";

type ScriptManager = {
	script: ScriptPlayer
	history: typeof history
	layers: InGameLayersHandler
	actionsHandler: UserActionsHandler
}
export const useScriptManager = ({script, history, layers, actionsHandler}: ScriptManager) => {
	useEffect(()=> {
		if (history.empty) displayMode.screen = SCREEN.TITLE

		actionsHandler.onScriptChange(script)
		script.setCommands(commands)

		if (!script.continueScript) {
			script.addEventListener('afterBlock', ()=> {
				script.stop()
				window.history.back()
			})
		}

		script.addEventListener('autoPlayStop', onAutoPlayStop)
		if (!script.currentBlock) script.start()
		
		const {track, looped_se} = script.audio
		track && track.length > 0 ? audio.playGameTrack(track) : audio.stopGameTrack()
		looped_se && looped_se.length > 0 ? audio.playWave(looped_se, true) : audio.stopWave()
		
		window.script = script
	}, [script])
	
	useEffect(()=> {
		if (!script || history.empty) return
		//pause script execution when text is not the top layer
		const isTextTop = layers.topLayer === 'text'
		isTextTop ? script.resume() : script.pause()
	}, [layers.topLayer, script])
}