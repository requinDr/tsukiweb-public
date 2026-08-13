import { assets, audioSePath, audioTrackPath } from "../translation/assets"
import { settings } from "./settings"
import { observe } from "@tsukiweb/common/utils/Observer"
import { asyncDelay } from "@tsukiweb/common/utils/timer"
import { splitFirst } from "@tsukiweb/common/utils/utils"
import { createCommands } from "@tsukiweb/common/audio/utils"
import { GameAudioManager } from "@tsukiweb/common/audio/AudioManager"
import { ScriptPlayer } from "engine/ScriptPlayer"
import { waitLanguageLoad } from "translation/lang"
import { displayMode, SCREEN } from "app/utils/display"

function getUrl(id: string): string {
  if (id.startsWith('"') && id.endsWith('"'))
    id = id.substring(1, id.length-1)
  if (id.startsWith('*')) {
    const trackName = parseInt(id.substring(1)).toString().padStart(2, '0')
    return audioTrackPath(trackName)
  }
  else if (id.includes('/')) {
    const [rootDir, subPath] = splitFirst(id, '/')
    if (rootDir == 'pd')
      return audioSePath(subPath!, true)
    else {
      return id
    }
  }
  return audioSePath(id)
}

async function createAudioBuffer(url: string) {
  const result = await fetch(url)
  if (!result.ok)
    throw Error(`audio file ${url} not found: ${result.statusText}`)
  const data = await result.arrayBuffer()
  const buffer = await audio.context.decodeAudioData(data)
  return buffer
}

export const audio = new GameAudioManager(settings, assets, "audio")
assets.setProvider("audio", (id)=> {
  if (id.startsWith('"') && id.endsWith('"'))
    id = id.substring(1, id.length-1)
  let audioUrl
  if (id.startsWith('*')) {
    const trackName = parseInt(id.substring(1)).toString().padStart(2, '0')
    audioUrl = audioTrackPath(trackName)
  } else if (id.startsWith('se_')) {
    audioUrl = audioSePath(id)
  } else if (id.startsWith('pd/se_')) {
    audioUrl = audioSePath(id.substring(3), true)
  } else {
    return undefined
  }
  return {
    url: audioUrl,
    value: createAudioBuffer(audioUrl)
  }
})

//__________________________________observers___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// update track source
observe(settings, 'trackSource', ()=> {
  assets.clear()
  if (audio.track)
    audio.playTrack(audio.track, true);
})

observe(displayMode, 'screen', (screen)=> {
  const inGame = (screen == SCREEN.WINDOW)
  audio.inGame = inGame
  if (!inGame) {
    audio.playTrack(settings.titleMusic)
  }
})

waitLanguageLoad().then(async ()=> {
  await asyncDelay(100)
  if (displayMode.screen != SCREEN.WINDOW) {
    audio.playTrack(settings.titleMusic)
  }
});

//___________________________________commands___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export const commands = {
  ...createCommands(audio),
  
  //Plus-Disc-only custom command
  'wave_wait': (arg: string, _: string, script: ScriptPlayer,
               onFinish: VoidFunction)=> {
    script.audio.looped_se = null
    if (audio.waveVolume * audio.masterVolume > 0) {
      audio.playWave(arg)
      audio.waitWaveEnd().then(onFinish)
      return {
        next: audio.stopWave.bind(audio)
      }
    }
  },
}

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.audio = audio