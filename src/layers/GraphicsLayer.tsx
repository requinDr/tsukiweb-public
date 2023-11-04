import { memo, useCallback, useRef, useState } from "react";
import { gameContext, settings } from "../utils/variables";
import { observe, useObserved, useObserver } from "../utils/Observer";
import { SCREEN, displayMode } from "../utils/display";
import { Graphics, SpritePos, preloadImage } from "../components/GraphicsComponent";
import { objectMatch, resettable, splitFirst, splitLast, useTraceUpdate } from "../utils/utils";
import { wordImage } from "../utils/lang";

const [transition, resetTransition] = resettable({
  effect: "",
  duration: 0,
  pos: "a" as SpritePos|'a',
})

const [quakeEffect, resetQuake] = resettable({
  x: 0, y: 0,
  duration: 0,
})

observe(displayMode, 'screen', (screen)=> {
  if (screen != SCREEN.WINDOW) {
    resetTransition()
    resetQuake()
  }
})

//##############################################################################
//#                                 FUNCTIONS                                  #
//##############################################################################

/**
 * Move background up or down
 */
export function moveBg(direction: "up"|"down") {
  const positions: Array<typeof displayMode.bgAlignment>
      = ["top", "center", "bottom"]
  let index = positions.indexOf(displayMode.bgAlignment)
  if (direction == "down" && index < 2) index++
  else if(direction == "up" && index > 0) index--
  displayMode.bgAlignment = positions[index]
}

function endTransition() {
  transition.duration = 0
}
//_____________________________script command tools_____________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function extractImage(image: string) {
  let text;
  [image, text] = splitFirst(image, '$')
  if (image.startsWith('"') && image.endsWith('"')) {
    // remove ':a;', 'image/', '"', '.jpg'
    image = image.substring(1, image.length-1)
                 .replace(/:a;|image[\/\\]|\.\w+$/g, '')
                 .replace('\\', '/')
    const [dir, name] = image.split('/')
    if (dir == "bg") {
      switch (name) {
        case "ima_10"  : image = "#000000"; break
        case "ima_11"  : image = "#ffffff"; break
        case "ima_11b" : image = "#9c0120"; break;
      }
    } else if (dir == "word") {
      if (text)
        throw Error(`Cannot cumulate word image and text (${image}, ${text})`);
      [image, text] = splitFirst(wordImage(image), '$')
    }
    else if (dir == "event") {
      if (!settings.eventImages.includes(image))
        settings.eventImages.push(image)
    }
  } else if (!image.startsWith('#')) { // not image nor color
    throw Error(`cannot extract image from "${image}"`)
  }
  return text ? `${image}$${text}` : image
}

function getTransition(type: string, skipTransition = false) {
  let duration = 0
  let effect = type

  if (effect.startsWith('type_'))
    effect = effect.substring('type_'.length)

  const index = effect.lastIndexOf('_')
  if (index !== -1) {
    if (!skipTransition) {
      let speed = effect.substring(index+1)
      switch(speed) {
        case 'slw': duration = 1500; break
        case 'mid': duration = 800; break
        case 'fst': duration = 400; break
        default : throw Error(`Ill-formed effect '${effect}'`)
      }
    }
    effect = effect.substring(0, index)
  }
  return {effect, duration}
}

function applyChange(pos: SpritePos, image: string, type: string, onFinish: VoidFunction) {

  let change = setSprite(pos as SpritePos, image)

  if (pos == 'bg' && !change && objectMatch(gameContext.graphics, {l: "", c: "", r: ""}))
      change = true

  // update transition only if sprites have been changed
  if (change) {
    const {effect, duration} = getTransition(type)
    transition.effect = effect
    transition.duration = duration
    transition.pos = pos as SpritePos|'a'

    if (duration > 0) {
      displayMode.graphics = true
      // Listen for the 'duration' to be set to 0
      // The component sets it to 0 after completing the animation,
      // and calling 'next' the command also sets it to 0
      observe(transition, 'duration',
          pos != 'bg' ? onFinish : ()=> { clearAllSprites(); onFinish() },
          { filter: (d)=> d == 0, once: true })
      return { next: endTransition }
    } else if (pos == 'bg') {
      // instant background change erases all sprites
      clearAllSprites()
    }
  }
}

function clearAllSprites() {
  const graphics = gameContext.graphics
  const changed = (graphics.l != "" || graphics.c != "" || graphics.r != "")
  graphics.l = ""
  graphics.c = ""
  graphics.r = ""
  return changed
}

function setSprite(pos: SpritePos|'a', image: string): boolean {
  if (pos == 'a') {
    if (image.length > 0)
      throw Error("Unexpected image parameter with 'a' position")
    return clearAllSprites()
  } else if (gameContext.graphics[pos as SpritePos] != image) {
    gameContext.graphics[pos as SpritePos] = image
    return true
  } else {
    return false
  }
}

//_______________________________script commands________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function processImageCmd(arg: string, cmd: string, onFinish: VoidFunction) {
  let pos:string = 'bg',
      image:string = '',
      type:string = ''

  switch(cmd) {
    case 'bg': [image, type] = splitLast(arg, ',') as [string, string]; break
    case 'cl': [pos, type] = arg.split(','); break
    case 'ld':
      [pos, arg] = splitFirst(arg, ',') as [string, string]
      [image, type] = splitLast(arg, ',') as [string, string]
      break
    default : throw Error(`unknown image command ${cmd} ${arg}`)
  }
  // get image
  if (image)
    image = extractImage(image)
  type = type?.replace('%', '')

  return applyChange(pos as SpritePos, image, type, onFinish)
}

function processQuake(arg: string, cmd: string, onFinish: VoidFunction) {
  const [ampl, duration] = arg.split(',').map(x=>parseInt(x))
  switch(cmd) {
    case 'quakex' : quakeEffect.x = ampl; break
    case 'quakey' : quakeEffect.y = ampl; break
  }
  quakeEffect.duration = duration;
  observe(quakeEffect, "duration", ()=> {
    quakeEffect.x = 0
    quakeEffect.y = 0
    onFinish()
  }, { filter: (d: number)=> d == 0, once: true })
  return { next: ()=> { quakeEffect.duration = 0 } }
}

function processMonocro(color: string) {
  if (color == "off")
    color = ""
  gameContext.monochrome = color
}

const commands = {
  'bg' : processImageCmd,
  'ld' : processImageCmd,
  'cl' : processImageCmd,
  'quakex'  : processQuake,
  'quakey'  : processQuake,
  'monocro' : processMonocro, //TODO : crossfade ?
}

export {
  commands
}

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

//________________________________Tool functions________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

type GraphicTransitionResult = {
  img: string, prev: string,
  duration: number, effect: string,
  imgLoaded: boolean
}

function useGraphicTransition(pos: SpritePos, preload: boolean = true): GraphicTransitionResult {
  const [img, setImg] = useState(gameContext.graphics[pos])
  const [loaded, setLoaded] = useState(true)
  const prev = useRef(gameContext.graphics[pos])
  const [d, setD] = useState(0)
  const [e, setE] = useState("")

  const onChange = useCallback(()=> {
    const {duration: transD, pos: transPos, effect: transE} = transition
    if (transD == 0 || transPos != pos && (pos == 'bg' || transPos != 'a')) {
      setD(0)
      setE("")
      prev.current = gameContext.graphics[pos]
    } else {
      setD(transD)
      setE(transE)
    }
  }, [])
  useObserver(onChange, transition, 'duration')
  useObserver(onChange, transition, 'effect')

  useObserver((img)=> {
    setImg(img)
    if (preload && img) {
      setLoaded(false)
      img = splitFirst(img, '$')[0]
      preloadImage(img).finally(setLoaded.bind(null, true))
    } else {
      setLoaded(true)
    }
    onChange()
  }, gameContext.graphics, pos)

  return {img, prev: prev.current, duration: d, effect: e, imgLoaded: loaded}
}

//________________________________Sub components________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

//.......... l, c, r sprites ...........
const SpriteGraphics = memo(({pos}: {pos: Exclude<SpritePos, 'bg'>})=> {
  const {img: currImg, prev: prevImg, duration: fadeTime, effect, imgLoaded}
      = useGraphicTransition(pos)

  //useTraceUpdate(pos, {pos, currImg, prevImg, fadeTime, effect, imgLoaded})

  if (!imgLoaded || prevImg == currImg)
    return <Graphics key={prevImg} pos={pos} image={prevImg}/>

  return <>
    {fadeTime > 0 &&
      <Graphics key={prevImg} pos={pos} image={prevImg} fadeOut={effect}
                fadeTime={fadeTime} toImg={currImg}
                onAnimationEnd={endTransition}/>
    }
    {(fadeTime == 0 || effect != "") &&
      <Graphics key={currImg} pos={pos} image={currImg} fadeIn={effect}
                fadeTime={fadeTime} onAnimationEnd={endTransition}/>
    }
  </>
})

//............. background .............
const BackgroundGraphics = memo(()=> {
  const [bgAlign] = useObserved(displayMode, 'bgAlignment')
  const {img: currImg, prev: prevImg, duration: fadeTime, effect: _effect}
      = useGraphicTransition('bg', false)
  const bgTransition = fadeTime > 0

  //useTraceUpdate('bg', {bgAlign, currImg, prevImg, fadeTime, _effect})

  const img = bgTransition ? prevImg : currImg
  return (
    <Graphics key={img} pos='bg' image={img} {...{'bg-align': bgAlign}}/>
  )
})

//............. foreground .............
//(used to make background transitions over the sprites)
const ForegroundGraphics = memo(()=> {
  const [bgAlign] = useObserved(displayMode, 'bgAlignment')
  const {img, duration, effect, imgLoaded} = useGraphicTransition('bg')

  //useTraceUpdate('fg', {bgAlign, img, duration, effect, imgLoaded, randId})
  return (imgLoaded && duration > 0 && effect != "") ? (
    <Graphics key={img} pos='bg' image={img} fadeTime={duration} fadeIn={effect}
              onAnimationEnd={endTransition} {...{'bg-align': bgAlign}}/>
  ) : <></>
})

//________________________________Main component________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const GraphicsLayer = memo(function({...props}: Record<string, any>) {

  const [quake] = useObserved(quakeEffect, 'duration', (d)=>d!=0)
  const [monoChrome] = useObserved(gameContext, 'monochrome')

//........ animation callbacks .........
  const onQuakeEnd = useCallback(()=> {
    quakeEffect.duration = 0
  }, [])

//......... compute properties .........
  let style, className
  ({style, className, ...props} = props)
  style = { ...style }
  
  const classList = className?.trim().split("") ?? []
  classList.push('layer', 'graphics')
  if (quake) {
    classList.push('quake')
    style['--quake-x'] = `${quakeEffect.x}pt`
    style['--quake-y'] = `${quakeEffect.y}pt`
    style['--quake-time'] = `${quakeEffect.duration}ms`
  }
  if (monoChrome) {
    classList.push("monochrome")
    style['--monochrome-color'] = monoChrome
  }
//............... render ...............
  return (
    <div className={classList.join(' ')} {...props}
         style={style} onAnimationEnd={onQuakeEnd}
         id="layer-graphics">

      <BackgroundGraphics/>
      <SpriteGraphics pos='l'/>
      <SpriteGraphics pos='c'/>
      <SpriteGraphics pos='r'/>
      <ForegroundGraphics/>
    </div>
  )
})
export default GraphicsLayer

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.transition = transition
