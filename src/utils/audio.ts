import { displayMode, SCREEN } from "./display"
import { audioSePath, audioTrackPath } from "../translation/assets"
import { settings } from "./settings"
import { observe } from "@tsukiweb-common/utils/Observer"
import { BasicAudioManager } from "@tsukiweb-common/utils/AudioManager"
import { asyncDelay } from "@tsukiweb-common/utils/timer"
import { ScriptPlayer } from "script/ScriptPlayer"
import { splitFirst } from "@tsukiweb-common/utils/utils"
import { calcGain } from "@tsukiweb-common/utils/audio"
import { isLanguageLoaded, waitLanguageLoad } from "translation/langSelection"

function getUrl(id: string): string {
  if (id.startsWith('"') && id.endsWith('"'))
    id = id.substring(1, id.length-1)
  if (id.startsWith('*')) {
    const trackNum = parseInt(id.substring(1))
    return audioTrackPath(trackNum)
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

export const gameAudio = new BasicAudioManager(getUrl)
export const sysAudio = new BasicAudioManager(getUrl)

//__________________________________observers___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// update volume
observe(settings.volume, 'track' , v => { gameAudio.track.volume = calcGain(v) })
observe(settings.volume, 'se'    , v => { gameAudio.se.volume = calcGain(v) })
observe(settings.volume, 'titleTrack', v => { sysAudio.track.volume = calcGain(v) })
observe(settings.volume, 'systemSE'  , v => { sysAudio.se.volume = calcGain(v) })
observe(settings.volume, 'master', v => {
  const gain = calcGain(v)
  gameAudio.volume = calcGain(v)
  sysAudio.volume = gain
})
const masterVolume = calcGain(settings.volume.master)
gameAudio.volume = masterVolume
gameAudio.track.volume = calcGain(settings.volume.track)
gameAudio.se.volume = calcGain(settings.volume.se)
sysAudio.volume = masterVolume
sysAudio.track.volume = calcGain(settings.volume.titleTrack)
sysAudio.se.volume = calcGain(settings.volume.systemSE)

// update track source
observe(settings, "trackSource", ()=> {
  gameAudio.clearAudioBuffers(true)
  sysAudio.clearAudioBuffers(true)
})

// mute on hide
observe(settings, 'autoMute', (m) => {
  gameAudio.autoMute(m)
  sysAudio.autoMute(m)
})

if (settings.autoMute) {
  gameAudio.autoMute()
  sysAudio.autoMute()
}

observe(displayMode, 'screen', (screen)=> {
  if (screen == SCREEN.WINDOW) {
    gameAudio.resume()
    sysAudio.track.stop()
  } else {
    if (gameAudio.playing) {
      gameAudio.suspend()
      gameAudio.track.stop()
      gameAudio.se.stop()
    }
    if (!sysAudio.track.playing && isLanguageLoaded())
      sysAudio.track.play(settings.titleMusic, {loop: true})
  }
})

waitLanguageLoad().then(async ()=> {
  await asyncDelay(100)
  if (displayMode.screen != SCREEN.WINDOW)
    sysAudio.track.play(settings.titleMusic, {loop: true});
});

//___________________________________commands___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export const commands = {
  'play'    : (arg: string, _: string, script: ScriptPlayer)=> {
    script.audio.track = arg
    gameAudio.track.play(arg, {loop: true})
  },
  'playstop': (_a: string, _c: string, script: ScriptPlayer)=> {
    script.audio.track = null
    gameAudio.track.stop()
  },
  'wave'    : (arg: string, _: string, script: ScriptPlayer)=> {
    script.audio.looped_se = null
    gameAudio.se.play(arg)
  },
  'waveloop': (arg: string, _: string, script: ScriptPlayer)=> {
    script.audio.looped_se = arg
    gameAudio.se.play(arg, {loop: true})
  },
  'wavestop': (_a: string, _c: string, script: ScriptPlayer)=> {
    script.audio.looped_se = null
    gameAudio.se.stop()
  },
}

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.audio = gameAudio
window.sysAudio = sysAudio