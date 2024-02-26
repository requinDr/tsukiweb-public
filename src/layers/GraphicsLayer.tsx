import { memo, useCallback } from "react";
import { gameContext } from "../utils/variables";
import { observe, useObserved } from "../utils/Observer";
import { SCREEN, displayMode } from "../utils/display";
import { resettable, splitFirst, splitLast, useTraceUpdate } from "../utils/utils";
import { extractInstructions } from "../utils/scriptUtils";
import GraphicsElement from "../components/molecules/GraphicsElement";
import { SpritePos } from "../components/molecules/GraphicsGroup";
import useGraphicTransition from "../components/hooks/useGraphicTransition";
import SpriteGraphics from "../components/molecules/SpriteGraphics";
import { applyChange, endTransition, extractImage, resetTransition, transition } from "../utils/graphics";

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
      let arg1
      [pos, arg1] = splitFirst(arg, ',') as [string, string]
      [image, type] = splitLast(arg1, ',') as [string, string]
      break
    default : throw Error(`unknown image command ${cmd} ${arg}`)
  }

  type = type.replace('%', '')
  //check if text line starts right after command
  const match = /\W/.exec(type)
  if (match) {
    const secondInstrLength = type.length - match.index
    return [
      {cmd, arg: arg.substring(0, arg.length - secondInstrLength)},
      ...extractInstructions(type.substring(type.length - secondInstrLength))
    ]
  } else {
    // get image
    if (image)
      image = extractImage(image)
    return applyChange(pos as SpritePos, image, type, onFinish)
  }
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
  gameContext.graphics.monochrome = color
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

//________________________________Sub components________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

//............. background .............
const BackgroundGraphics = memo(()=> {
  const [bgAlign] = useObserved(displayMode, 'bgAlignment')
  const {img: currImg, prev: prevImg, duration: fadeTime, effect: _effect}
      = useGraphicTransition('bg', false)
  const bgTransition = fadeTime > 0

  //useTraceUpdate('bg', {bgAlign, currImg, prevImg, fadeTime, _effect})

  const img = bgTransition ? prevImg : currImg
  return (
    <GraphicsElement key={img}
      pos='bg'
      image={img}
      {...{'bg-align': bgAlign}}/>
  )
})

//............. foreground .............
//(used to make background transitions over the sprites)
const ForegroundGraphics = memo(()=> {
  const [bgAlign] = useObserved(displayMode, 'bgAlignment')
  const {img, duration, effect, imgLoaded} = useGraphicTransition('bg')

  //useTraceUpdate('fg', {bgAlign, img, duration, effect, imgLoaded, randId})
  return (imgLoaded && duration > 0 && effect != "") ? (
    <GraphicsElement key={img}
      pos='bg'
      image={img}
      fadeTime={duration}
      fadeIn={effect}
      onAnimationEnd={endTransition} {...{'bg-align': bgAlign}}/>
  ) : <></>
})

//________________________________Main component________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GraphicsLayer = memo(function({...props}: Record<string, any>) {

  const [quake] = useObserved(quakeEffect, 'duration', (d)=>d!=0)
  const [monoChrome] = useObserved(gameContext.graphics, 'monochrome')

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
