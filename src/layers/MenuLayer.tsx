import { useEffect, useRef, useState } from "react"
import { addEventListener, isFullscreen, toggleFullscreen } from "../utils/utils"
import { MdFastForward, MdFullscreen, MdFullscreenExit, MdOutlineVolumeOff, MdOutlineVolumeUp, MdPlayArrow } from "react-icons/md"
import { gameContext, settings } from "../utils/variables"
import { quickLoad, quickSave } from "../utils/savestates"
import { useObserved } from "../utils/Observer"
import script from "../utils/script"
import { displayMode, SCREEN } from "../utils/display"
import strings from "../utils/lang"
import ParticlesComponent from "../components/ParticlesComponent"
import Ornament from "../assets/images/ornament.webp"

/**
 * TODO
 * - Go to next scene
 */
const MenuLayer = () => {

  const menuRef = useRef<HTMLDivElement>(null)
  const [mute] = useObserved(settings.volume, 'master', (vol)=>vol<0)
  const [fullscreen, setFullscreen] = useState<boolean>(isFullscreen())
  const [display] = useObserved(displayMode, 'menu')

  useEffect(()=> {
    if (!display && menuRef.current?.contains(document.activeElement))
      (document.activeElement as HTMLElement).blur?.();
  }, [display])

  useEffect(() => {
    //if a left click is made outside the menu, hide it
    const handleClick = (e: MouseEvent) => {
      if (e.button === 0 && displayMode.menu && !menuRef.current?.contains(e.target as Node)) {
        displayMode.menu = false
      }
    }
    return addEventListener({event: 'mousedown', handler: handleClick})
  })

  useEffect(()=> {
    return addEventListener({event: 'fullscreenchange', handler: ()=> {
      setFullscreen(isFullscreen())
    }})
  }, [])

  const graphicMode = () => {
    displayMode.graphics = !displayMode.graphics;
    displayMode.menu = false
  }

  const historyMode = () => {
    displayMode.menu = false
    displayMode.history = true
  }

  const saveMode = () => {
    displayMode.menu = false
    displayMode.save = true
  }

  const loadMode = () => {
    displayMode.menu = false
    displayMode.load = true
  }

  const configMode = () => {
    displayMode.menu = false
    displayMode.config = true
  }

  const autoPlay = () => {
    displayMode.menu = false
    script.autoPlay = true
  }

  const title = () => {
    displayMode.screen = SCREEN.TITLE
    displayMode.menu = false
  }

  const toggleVolume = () => {
    settings.volume.master = - settings.volume.master
  }

  const fastForwardScene = ()=> {
    const currLabel = gameContext.label
    script.fastForward((_l, _i, label)=> label != currLabel)
    displayMode.menu = false
  }

  return (
    <div className={`layer ${display ? "show" : ""}`} id="layer-menu">
      <ParticlesComponent />
      <img src={Ornament} alt="ornament" className="bottom-ornament" />
      <img src={Ornament} alt="ornament" className="top-ornament" />
      
      <nav className="menu-container" ref={menuRef}>
        <menu>
          <div className="top" />

          <div className="layer-btns">
            <button onClick={graphicMode} className="layer-btn">
              {strings.menu["graphics"]}
            </button>
            <button onClick={historyMode} className="layer-btn">
              {strings.menu["history"]}
            </button>
            <button onClick={saveMode} className="layer-btn">
              {strings.menu["save"]}
            </button>
            <button onClick={loadMode} className="layer-btn">
              {strings.menu["load"]}
            </button>
            <button onClick={configMode} className="layer-btn">
              {strings.menu["config"]}
            </button>
            <button onClick={title} className="layer-btn">
              {strings.menu["title"]}
            </button>
          </div>

          <div className="action-btns">
            <button onClick={quickSave} className="quick">
              {strings.menu["q-save"]}
            </button>
            <button onClick={quickLoad} className="quick">
              {strings.menu["q-load"]}
            </button>
            <button onClick={toggleVolume} aria-label="mute/unmute">
              {mute ? <MdOutlineVolumeOff /> : <MdOutlineVolumeUp />}
            </button>
            <button onClick={toggleFullscreen} aria-label="toggle fullscreen">
              {fullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
            </button>
            <button onClick={autoPlay} aria-label="auto play" title={strings.menu["auto-play"]}>
              <MdPlayArrow />
            </button>
            <button onClick={fastForwardScene} aria-label="skip scene" title={strings.menu["ffw"]}>
              <MdFastForward />
            </button>
          </div>
        </menu>
      </nav>
    </div>
  )
}

export default MenuLayer
