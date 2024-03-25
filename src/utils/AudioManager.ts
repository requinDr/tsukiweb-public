import { observe } from "./Observer"
import { displayMode, SCREEN } from "./display"
import { audioSePath, audioTrackPath } from "../translation/assets"
import { TSForceType } from "./utils"
import { gameContext } from "./variables"
import { settings } from "./settings"

//##############################################################################
//#                             AudioManager class                             #
//##############################################################################
const autoPlayEnablingEvents = [
  'auxclick', 'click'    , 'contextmenu',
  'dblclick', 'mousedown', 'mouseup',
  'keydown' , 'keyup'    , 'touchend'
]

class AudioManager {

  private context: AudioContext|null

  //Gain nodes.
  //Set separate gains for track and effects,
  //and merge them into a global gain node to apply a common gain.
  private trackGainNode: GainNode | {gain: {value: number}}
  private seGainNode: GainNode | {gain: {value: number}}
  private masterGainNode: GainNode | {gain: {value: number}}

  //Source nodes.
  //Play the sounds from audio buffers.
  private trackNode: AudioBufferSourceNode|null
  private seNode: AudioBufferSourceNode|null

  private currentTrack: string|undefined
  private currentSE: string|undefined
  private trackLooped: boolean
  private seLooped: boolean

  /**
   * Maps track names and effect names to their audio buffers and paths.
   * Audio buffers are loaded the first time they are used.
   */
  private sounds: Map<string, AudioBuffer|Promise<AudioBuffer>>
  private soundIdToPath: ((key: string)=> string)|null

  constructor() {
    this.context = null
    this.trackGainNode = {gain: {value: 1}} // fake gain nodes to keep gain value
    this.seGainNode =  {gain: {value: 1}}
    this.masterGainNode =  {gain: {value: 1}}
    this.sounds = new Map()
    this.soundIdToPath = null

    this.trackNode = null
    this.seNode = null
    this.currentTrack = undefined
    this.currentSE = undefined
    this.trackLooped = false
    this.seLooped = false
    
    const resume = ()=> {
      this.context?.resume()
      for (const evt of autoPlayEnablingEvents)
        removeEventListener(evt, resume)
    }
    for (const evt of autoPlayEnablingEvents)
      addEventListener(evt, resume)
  }

  private buildNodes() {
    if (this.context)
      return

    this.context = new AudioContext()
    const masterVolume = this.masterGainNode.gain.value
    const trackVolume = this.trackGainNode.gain.value
    const seVolume = this.seGainNode.gain.value
    this.masterGainNode = this.context.createGain()
    this.trackGainNode = this.context.createGain()
    this.seGainNode = this.context.createGain()
    this.masterGainNode.gain.value = masterVolume
    this.trackGainNode.gain.value = trackVolume
    this.seGainNode.gain.value = seVolume

    TSForceType<GainNode>(this.trackGainNode)
    TSForceType<GainNode>(this.masterGainNode)
    TSForceType<GainNode>(this.seGainNode)

    this.trackGainNode.connect(this.masterGainNode)
    this.seGainNode.connect(this.masterGainNode)
    this.masterGainNode.connect(this.context.destination)
  }

//______________________________public properties_______________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Common gain for both track and SE. Applied after track gain and SE gain
   */
  set masterVolume(value: number) {
    this.masterGainNode.gain.value = value
  }

  get masterVolume() : number {
    return this.masterGainNode.gain.value
  }

  /**
   * Gain for the track.
   */
  set trackVolume(value: number) {
    this.trackGainNode.gain.value = value
  }

  get trackVolume() : number {
    return this.trackGainNode.gain.value
  }

  /**
   * Gain for the special effects.
   */
  set seVolume(value: number) {
    this.seGainNode.gain.value = value
  }

  get seVolume() : number {
    return this.seGainNode.gain.value
  }

//________________________________public methods________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Set the function to convert a sound id to its path, called
   * when a sound is played
   * @param f function that converts the sound id to its path
   */
  setSoundIdToPath(f: (id: string)=> string) : void {
    this.soundIdToPath = f
  }

  /**
   * Clear all loaded audio buffers.
   * If tracks or se were playing, restart them
   */
  resetBuffers() : void {
    this.sounds.clear()
    if (this.currentTrack)
      this.playTrack(this.currentTrack, this.trackLooped)
    if (this.currentSE)
      this.playSE(this.currentSE, this.seLooped)
  }

  /**
   * Set the track to play. If a track is already playing, it is replaced
   * by the specified one. Fetch the audio buffer if necessary.
   * @param name name of the track to play.
   * @param loop true if the track must be looped when it reaches the end
   *             of the audio buffer, false otherwise. Defaults to true.
   */
  async playTrack(name: string, loop = true): Promise<void> {
    this.buildNodes()
    TSForceType<AudioContext>(this.context)
    TSForceType<GainNode>(this.trackGainNode)

    if (this.trackNode) {
      this.trackNode.stop()
      this.trackNode.disconnect()
      this.trackNode = null
    }
    this.currentTrack = name
    this.trackLooped = loop
    const source = await this.createABSource(name, loop)
    if (this.currentTrack == name && loop == this.trackLooped) { // if track has not been changed while the source was loading
      if (this.trackNode)
        return // the track was loaded twice
      this.trackNode = source
      this.trackNode.connect(this.trackGainNode)
      this.context.resume()
      this.trackNode.start()
      this.trackNode.onended = ()=> {
        if (this.trackNode == source) { // if node has not been replaced
          this.trackNode.disconnect()
          this.trackNode = null
          if (this.currentTrack == name)
            this.currentTrack = undefined
        }
      }
    }
  }

  /**
   * Stop the current track.
   */
  stopTrack(): void {
    this.trackNode?.stop()
  }

  /**
   * Check if a track is playing. When a track ends,
   * it is no longer considered playing.
   * @returns true if a track is playing, false otherwise.
   */
  isTrackPlaying(): boolean {
    return !!this.trackNode
  }

  /**
   * Set the special effect to play. If a track is already playing,
   * it is replaced by the specified one. Fetch the audio buffer if necessary.
   * @param name name of the SE to play.
   * @param loop true if the SE must be looped when it reaches the end
   *             of the audio buffer, false otherwise. Defaults to false.
   */
  async playSE(name: string, loop = false): Promise<void> {
    this.buildNodes()
    TSForceType<AudioContext>(this.context)
    TSForceType<GainNode>(this.seGainNode)

    if (this.seNode) {
      this.seNode.stop()
      this.seNode.disconnect()
      this.seNode = null
    }
    this.currentSE = name
    this.seLooped = loop
    const source = await this.createABSource(name, loop)
    if (name == this.currentSE && loop == this.seLooped) {
      if (this.seNode)
        return // the se was loaded twice
      this.seNode = source
      this.seNode.connect(this.seGainNode)

      this.context.resume()
      this.seNode.start()
      this.seNode.onended = ()=> {
        if (this.seNode == source) {
          this.seNode.disconnect()
          this.seNode = null
          if (this.currentSE == name)
            this.currentSE = undefined
        }
      }
    }
  }

  /**
   * Stop the current track.
   */
  stopSE() : void {
    this.seNode?.stop()
  }

//_______________________________private methods________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Load the audio buffer of the specified track / special effect,
   * using the stored url.
   * @param name name of the track / SE.
   * @param forceReload force fetching the audio buffer again
   *                    if it is already stored.
   * @returns a promise resolved with the audio buffer when it is loaded.
   */
  private async loadFile(name: string, forceReload: boolean = false): Promise<AudioBuffer> {
    if (!forceReload) {
      const storedBuffer = this.sounds.get(name)
      if (storedBuffer)
        return storedBuffer
    }

    const path = this.soundIdToPath?.(name) ?? name
    let promisedBuffer: Promise<AudioBuffer>|AudioBuffer = fetch(path)
        .then(data=>data.arrayBuffer())
        .then(arrayBuffer=>{
          this.buildNodes()
          TSForceType<AudioContext>(this.context)
          return this.context.decodeAudioData(arrayBuffer)
        })
        .then(audioBuffer=>{
          promisedBuffer = audioBuffer
          this.sounds.set(name, audioBuffer)
          return Promise.resolve(audioBuffer)
        })
        .catch(reason=>Promise.reject(reason))
    this.sounds.set(name, promisedBuffer)
    return promisedBuffer
  }

  private async createABSource(name: string, loop: boolean): Promise<AudioBufferSourceNode>
  {
    this.buildNodes()
    TSForceType<AudioContext>(this.context)

    let audioBuffer = this.loadFile(name)
    if (!audioBuffer)
      return Promise.reject(`unknown sound name "${name}".`+
                            ` Use AudioManager.loadFile(name, src)`+
                            ` to load audio buffers`)
    const node: AudioBufferSourceNode = this.context.createBufferSource()
    node.buffer = await audioBuffer
    node.loop = loop

    return node
  }
}

//##############################################################################
//#                         Application-specific code                          #
//##############################################################################

export const audio = new AudioManager()

//_______________________________register sounds________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
audio.setSoundIdToPath((id)=> {
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
})

observe(settings, "trackSource", audio.resetBuffers.bind(audio))

//_______________________________react to changes_______________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function playTrack(name: string) {
  if (name?.length > 0)
    audio.playTrack(name, true)
  else
    audio.stopTrack()
}
function loopSE(name: string) {
  if (name?.length > 0)
    audio.playSE(name, true)
  else
    audio.stopSE()
}
const windowFilter = { filter: () => displayMode.screen == SCREEN.WINDOW }
observe(gameContext.audio, 'track', playTrack, windowFilter)
observe(gameContext.audio, 'looped_se', loopSE, windowFilter)

observe(displayMode, 'screen', (screen)=> {
  if (screen == SCREEN.WINDOW) {
    const {track, looped_se} = gameContext.audio
    playTrack(track)
    loopSE(looped_se)
    // audio.masterVolume = settingToGain(settings.volume.master)
  } else {
    playTrack('')
    loopSE('')
    // audio.masterVolume = 0
  }
  // uncomment masterVolume changes if game sound keeps playing on title menu
})

function muteOnTabSwitch() {
  if (document.visibilityState == "hidden") {
    if (settings.autoMute)
      audio.masterVolume = 0
  }
  else if (displayMode.screen == SCREEN.WINDOW) {
    audio.masterVolume = settingToGain(settings.volume.master)
  }
}

document.addEventListener("visibilitychange", muteOnTabSwitch)

function settingToGain(value: number) {
  if (value <= 0)
    return 0
  const valueRange = 10 // from 0 to 10. 0 => no sound.
  const dbRange = 25 // from -25dB to 0dB. -25 not used (volume=0 => no sound).
  const normalizedValue = value/valueRange
  const dB = normalizedValue*dbRange - dbRange
  return Math.pow(10, dB/20)
}

audio.masterVolume = settingToGain(settings.volume.master)
audio.trackVolume = settingToGain(settings.volume.track)
audio.seVolume = settingToGain(settings.volume.se)
observe(settings.volume, 'master', (v)=>{audio.masterVolume = settingToGain(v)})
observe(settings.volume, 'track' , (v)=>{audio.trackVolume = settingToGain(v)})
observe(settings.volume, 'se'    , (v)=>{audio.seVolume = settingToGain(v)})

//___________________________________commands___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export const commands = {
  'play'    : (arg: string)=>{ gameContext.audio.track = arg },
  'playstop': ()=>           { gameContext.audio.track = "" },
  'wave'    : (arg: string)=>{ audio.playSE(arg) },
  'waveloop': (arg: string)=>{ gameContext.audio.looped_se = arg },
  'wavestop': ()=>           { gameContext.audio.looped_se = "" },
}

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.audio = audio