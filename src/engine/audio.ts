import { audioSePath, audioTrackPath } from "../translation/assets"
import { settings } from "./settings"
import { observe } from "@tsukiweb-common/utils/Observer"
import { AudioManager } from "@tsukiweb-common/audio/AudioManager"
import { asyncDelay } from "@tsukiweb-common/utils/timer"
import { ScriptPlayer } from "engine/ScriptPlayer"
import { splitFirst } from "@tsukiweb-common/utils/utils"
import { calcGain, createCommands } from "@tsukiweb-common/audio/utils"
import { isLanguageLoaded, waitLanguageLoad } from "translation/langSelection"
import { displayMode, SCREEN } from "app/utils/display";

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

export const audio = new AudioManager(getUrl)

//__________________________________observers___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// update volume
observe(settings.volume, 'master'    , v => { audio.masterVolume = calcGain(v) })
observe(settings.volume, 'systemSE'  , v => { audio.uiVolume = calcGain(v) })
observe(settings.volume, 'se'        , v => { audio.waveVolume = calcGain(v) })
observe(settings.volume, 'track'     , v => { audio.gameTrackVolume = calcGain(v) })
observe(settings.volume, 'titleTrack', v => { audio.menuTrackVolume = calcGain(v) })
audio.masterVolume    = calcGain(settings.volume.master)
audio.gameTrackVolume = calcGain(settings.volume.track)
audio.waveVolume      = calcGain(settings.volume.se)
audio.menuTrackVolume = calcGain(settings.volume.titleTrack)
audio.uiVolume        = calcGain(settings.volume.systemSE)

// update track source
observe(settings, 'trackSource', audio.clearBuffers.bind(audio, true))

// mute on hide
observe(settings, 'autoMute', (m) => { audio.autoMute = m })
audio.autoMute = settings.autoMute

observe(displayMode, 'screen', (screen)=> {
  if (screen == SCREEN.WINDOW) {
    audio.stopMenuTrack()
  } else {
    audio.stopGameTrack()
    audio.stopWave()
    if (audio.menuTrack == null && isLanguageLoaded()) {
      audio.playMenuTrack(settings.titleMusic)
    }
  }
})

waitLanguageLoad().then(async ()=> {
  await asyncDelay(100)
  if (displayMode.screen != SCREEN.WINDOW) {
    audio.playMenuTrack(settings.titleMusic);
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