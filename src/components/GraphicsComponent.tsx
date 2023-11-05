import { CSSProperties, memo, useCallback } from "react";
import { settings } from "../utils/variables";
import { imageUrl, } from "../utils/lang";
import { findImageObjectByName } from "../utils/gallery";
import { splitFirst, useTraceUpdate } from "../utils/utils";
import { bb } from "../utils/Bbcode";
import { Graphics as GraphicsType } from "../types";

type DivProps = React.ComponentPropsWithoutRef<"div">

const POSITIONS = ['bg', 'l', 'c', 'r'] as const
export type SpritePos = typeof POSITIONS[number]

function isImage(str: string) {
  const c = str.charAt(0)
  return c != '#' && c != '$'
}

function graphicElement(pos: SpritePos, image: string,
    props: DivProps = {}, resolution=settings.resolution) {

  image = image || ((pos=="bg") ? "#000000" : "#00000000")
  const isColor = image.startsWith('#')
  let text
  [image, text] = splitFirst(image, '$')

  let imageElement = undefined
  let overlay = undefined
  if (isColor) {
    const {style, ...attrs} = props
    props = {
      style: { background: image, ...(style ?? {}) },
      ...attrs
    }
  } else {
    const imgUrl = imageUrl(image, resolution)
    const alt = `[[sprite:${image}]]`
    const blur = findImageObjectByName(image)?.sensitive && settings.blurThumbnails
    imageElement = <img src={imgUrl} alt={alt} draggable={false}
      className={blur ? "blur" : ""}
    />
  }
  if (text) {
    const match = text.match(/^(?<vAlign>[tcb])?`(?<str>[^`]*)`/)
    const {vAlign, hAlign, str} = match?.groups ?? {}
    overlay = <div className="text" {...{
        "vertical-align": vAlign ?? "c"
      }}>
      {bb(str ?? "[color=red][u]/!\\ Ill-formed text")}
    </div>
  }

  const className: string[] = [pos]
  const {className: insertClass, ...attrs} = props
  if (insertClass)
    className.push(insertClass)
  return (
    <div className={className.join(' ')} {...attrs}>
      {imageElement}
      {overlay}
    </div>
  )
}

export async function preloadImage(src:string, resolution=settings.resolution): Promise<void> {
  if (src.startsWith('#') || src.startsWith('$'))
    return
  else {
    return new Promise((resolve, reject)=> {
      const img = new Image()
      img.onload = resolve as VoidFunction
      img.onerror = img.onabort = reject
      img.src = imageUrl(src, resolution)
    })
  }
}

type GraphicsGroupProps = {
  images: GraphicsType
  spriteAttrs?: Partial<Record<SpritePos, DivProps>> | ((pos:SpritePos)=>DivProps)
  resolution?: typeof settings.resolution
} & DivProps

export const GraphicsGroup = memo(({images, spriteAttrs,
    resolution = settings.resolution, ...props}: GraphicsGroupProps)=> {
  const monochrome = images.monochrome ?? ""
  let {style, className, ...attrs} = props
  const classes = ['graphics']
  if (monochrome) {
    classes.push('monochrome')
    if (!style)
      style = {}
    style = {
      ...style,
      ...{'--monochrome-color': monochrome}
    }
  }
  if (className)
    classes.push(className)
  return <div className={classes.join(' ')} style={style} {...attrs}>
    {POSITIONS.map(pos => images[pos] && graphicElement(pos,
      images[pos] as string, {
        key: images[pos]||pos,
        ...(typeof spriteAttrs == 'function' ? spriteAttrs(pos)
            : spriteAttrs?.[pos] ?? {})
      }, resolution))
    }
  </div>
})

//##############################################################################
//#                                 COMPONENTS                                 #
//##############################################################################

type Props = {
  pos: SpritePos
  image: string
  resolution?: typeof settings.resolution
} & ({
  fadeIn?: undefined
  fadeOut?: undefined
  fadeTime?: 0
  toImg?: undefined
  onAnimationEnd?: undefined
} | (
  { fadeTime: number, onAnimationEnd: VoidFunction } & (
    { fadeIn: string, fadeOut?: undefined, toImg?: undefined } |
    { fadeOut: string, fadeIn?: undefined, toImg: string }
  )
)) & DivProps

export const GraphicsElement = memo(({pos, image, resolution=settings.resolution,
    fadeTime=0, fadeIn=undefined, fadeOut=undefined, toImg=undefined,
    onAnimationEnd=undefined, ...props} : Props)=> {

  //useTraceUpdate(`graph[${pos}]`, {pos, image, resolution, fadeTime, fadeIn,
  //                                 fadeOut, toImg, onAnimationEnd, ...props})

//____________________________________image_____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const imageProps = useCallback(()=> {
//.............. no image ..............
    if (!image) {
      return pos == 'bg' ? {} : undefined
    }
//............ static image ............
    else if (fadeTime == 0) {
      return {}
    }
//........ (dis)appearing image ........
    else {
      return {
        ...(fadeIn ? {'fade-in' : fadeIn}
          : fadeOut ? {'fade-out': fadeOut} : {}),
          style: {
            '--transition-time': `${fadeTime}ms`
          },
        onAnimationEnd
      }
    }
  }, [pos, image, fadeTime, fadeIn, fadeOut])()

//________________________________crossfade mask________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // add an opaque background to the crossfade-disappearing image to prevent
  // the background from being visible by transparency
  const maskProps = useCallback(()=> {
    if (pos != 'bg' && fadeTime > 0 && fadeOut == 'crossfade'
        && image && toImg && isImage(image) && isImage(toImg)) {
      return {
        'for-mask': "",
        style: {
          '--from-image': `url(${imageUrl(image)})`,
          '--to-image': `url(${imageUrl(toImg)})`
        } as CSSProperties
      }
    }

  }, [pos, image, toImg, fadeOut, fadeTime])()

//____________________________________render____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const {style: baseStyle = {}, ...baseAttrs} = (imageProps || {})  as DivProps
  const {style: insertStyle = {}, ...insertAttrs} = props
  return <>
    {maskProps != undefined && graphicElement(pos, image, maskProps, resolution)}
    {imageProps != undefined && graphicElement(pos, image, {
        style: {...baseStyle, ...insertStyle},
        ...baseAttrs,
        ...insertAttrs
      }, resolution)}
  </>
})