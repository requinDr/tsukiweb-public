import { displayMode, SCREEN } from "./display"
import { audioSePath, audioTrackPath } from "../translation/assets"
import { gameContext } from "./variables"
import { settings } from "./settings"
import { observe } from "@tsukiweb-common/utils/Observer"
import { AudioChannel, BasicAudioManager } from "@tsukiweb-common/utils/AudioManager"
import { isLanguageLoaded, waitLanguageLoad } from "translation/lang"
import { asyncDelay } from "@tsukiweb-common/utils/timer"

function calcGain(value: number) {
  if (value <= 0)
    return 0
  const valueRange = 10 // from 0 to 10. 0 => no sound.
  const dbRange = 25 // from -25dB to 0dB. -25 not used (volume=0 => no sound).
  const normalizedValue = value / valueRange
  const dB = normalizedValue * dbRange - dbRange
  return Math.pow(10, dB / 20)
}

function getUrl(id: string): string {
  let match
  if ((match = /^se(?<id>\d+)$/.exec(id)) != null) {
    const se = match.groups?.['id'] ?? '0'
    return audioSePath(parseInt(se)+1)
  }
  else if ((match = /^"\*(?<id>\d+)"$/.exec(id)) != null) {
    const track = match.groups?.['id'] ?? 0
    return audioTrackPath(track)
  }
  else {
    console.error(`unknown sound id: ${id}`)
    return id
  }
}

export const gameAudio = new BasicAudioManager(getUrl)
export const sysAudio = new BasicAudioManager(getUrl)

//__________________________________observers___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// update track and looped se
function updateLoop(channel: AudioChannel, name: string|null) {
  if (name && name.length > 0)
    channel.play(name, {loop: true})
  else
    channel.stop()
}

observe(gameContext.audio, 'track', updateLoop.bind(null, gameAudio.track))
observe(gameContext.audio, 'looped_se', updateLoop.bind(null, gameAudio.se))

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
    if (gameAudio.playing)
      gameAudio.suspend()
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
  'play'    : (arg: string)=>{ gameContext.audio.track = arg },
  'playstop': ()=>           { gameContext.audio.track = "" },
  'wave'    : (arg: string)=>{ gameAudio.se.play(arg) },
  'waveloop': (arg: string)=>{ gameContext.audio.looped_se = arg },
  'wavestop': ()=>           { gameContext.audio.looped_se = "" },
}

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.audio = gameAudio