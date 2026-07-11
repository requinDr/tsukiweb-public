import { AudioManager } from "@tsukiweb-common/audio/AudioManager";
import { observe } from "@tsukiweb-common/utils/Observer";
import { settings } from "./settings";
import { calcGain } from "@tsukiweb-common/audio/utils";

export class GameAudioManager extends AudioManager {
  _inGame: boolean = false

  constructor (...params: ConstructorParameters<typeof AudioManager>) {
    super(...params)
    this._updateVolumes = this._updateVolumes.bind(this)
    this._updateVolumes()
    for (const attr of ['master', 'se', 'titleTrack', 'systemSE', 'track'] as const)
      observe(settings.volume, attr, this._updateVolumes)
    observe(settings, 'autoMute', (m) => { this.autoMute = m })
    this.autoMute = settings.autoMute
  }
  
  private _updateVolumes() {
    this.masterVolume = calcGain(settings.volume.master)
    this.uiVolume = calcGain(settings.volume.systemSE)
    this.waveVolume = calcGain(settings.volume.se)
    this.trackVolume = calcGain(
      (this._inGame) ? settings.volume.track
                     : settings.volume.titleTrack)
  }

  get inGame() { return this._inGame }
  set inGame(inGame: boolean) {
    if (inGame != this._inGame) {
      this._inGame = inGame
      this.stopTrack()
      this.stopWave()
      this._updateVolumes()
    }
  }
}