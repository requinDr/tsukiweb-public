import { splitFirst, splitLast } from "@tsukiweb-common/utils/utils"
import { RouteDayName, RouteName } from "../types"
import { settings } from "../utils/settings"
import {TrackSourceId, strings} from "./lang"
import { TextImage } from "@tsukiweb-common/utils/lang"
import { closeBB } from "@tsukiweb-common/utils/Bbcode"
import { imageFormat } from "@tsukiweb-common/utils/images"

//##############################################################################
//#                                  PRIVATE                                   #
//##############################################################################

//______________________________private constants_______________________________
//------------------------------------------------------------------------------

const ASSETS_PATH = `${import.meta.env.BASE_URL}static/`

//______________________________private functions_______________________________
//------------------------------------------------------------------------------

function assetPath(basePath: string) {
  if (!/^\w+:\/\//.test(basePath)) // does not start with "<protocol>://"
    return ASSETS_PATH + basePath
  else
    return basePath
}

function textImageToStr(textImg: TextImage): string {
  const {center, top, bottom, bg="#000000"} = textImg
  let [text, vAlign] = center ? [center, 'c'] :
                       top    ? [top   , 't'] :
                       bottom ? [bottom, 'b'] :
                       [null, '']
  if (text) {
    if (Array.isArray(text))
      text = text.map(closeBB).join('\n')
    text = `$${vAlign}\`${text}\``
  }
  return `${bg}${text??""}`
}

//##############################################################################
//#                                   PUBLIC                                   #
//##############################################################################

//_______________________________public functions_______________________________
//------------------------------------------------------------------------------

export function scenesDir() {
  return assetPath(`${strings['scripts-dir']}`)
}

export function spriteSheetImgPath(file: string) {
	return assetPath(`jp/flowchart-spritesheet/${file}.${imageFormat}`)
}

function audioPath(formats: string|string[], trackName: string) {
  let format
  if (formats.constructor == String)
    format = formats
  else if (formats.length == 1)
    format = (formats as string[])[0]
  else {
    const audio = document.createElement('audio')
    format = (formats as string[]).find((f)=> {
      const [_, ext] = splitLast(f, '.')
      switch (ext) {
        case null : return true
        case 'mp3' : return true // consider all browser can play mp3
        case 'wav' : return true
        case 'opus' : return audio.canPlayType('audio/webm; codecs="opus"') == "probably"
        default : return true
      }
    }) ?? formats[formats.length-1]
  }

  return assetPath(`${format.replace('%', trackName)}.${import.meta.env.VITE_AUDIO_FORMAT}`)
}

export function audioTrackPath(track: string,
                               source: TrackSourceId = settings.trackSource) {
  return audioPath(strings.audio["tracks-path"][source], track)
}

export function audioSePath(se: string, pd: boolean = false) {
  const parent_dir = pd ? strings.audio["waves-pd-path"]
                        : strings.audio["waves-path"]
  return audioPath(parent_dir, se)
}

/**
 * Get the image source from the translation file.
 * @param img id of the image to get its source
 * @param res desired resolution. any of 'hd', 'sd' or 'thumb'
 * @returns the requested image's url
 */
export function imageSrc(img: string, res = settings.resolution) {
  if (img.startsWith('"') && img.endsWith('"'))
    img = img.substring(1, img.length-1)

  const [dir, name] = splitFirst(img, '/')
  const root = strings.images[res]
  let srcTemplate: string

  if (Object.hasOwn(root, img)) {
    srcTemplate = root[img as keyof typeof root]
  } else {
    if (!name)
      throw Error(`Unimplemented image format ${img}`)
    if (Object.hasOwn(root, dir)) {
      const parent = root[dir as keyof typeof root] as any as Record<string, string>
      srcTemplate = Object.hasOwn(parent, name) ? parent[name as keyof typeof parent] : parent[""]
    } else {
      srcTemplate = root[""]
    }
  }

  if (srcTemplate.startsWith('#'))
    return srcTemplate

  const replaced = srcTemplate
    .replace('%0', img)
    .replace('%1', dir)
    .replace('%2', name || "")
  return assetPath(`${replaced}.${imageFormat}`)
}

/**
 * Get the formatted string that replaces the image.
 * @param img image id to convert
 * @returns the formatted string that replaces the image
 */
export function wordImage(img: string) : string {
  if (img.startsWith("word/"))
    img = img.substring("word/".length)
  const textImage = strings.images.words[img]
  if (!textImage) {
    throw Error(`unknown word-image ${img}`)
  }
  return textImage
}

/**
 * Get the list of formatted strings and delays for the credits.
 * @returns the list of formatted strings and delays
 */
export function credits() : [string, number][] {
  return strings.credits.map(
    ({delay=5600, ...textImage})=> [textImageToStr(textImage), delay]
  )
}

/**
 * Get the phase title and subtitle texts.
 * @param route current route
 * @param routeDay section of the route
 * @param day day number, or special section
 * @returns an array of two elements where the first element is the text
 *          for the title, and the second element is the text for the subtitle
 */
export function phaseTexts(route: RouteName, routeDay: RouteDayName, day: number|RouteDayName<"others">): [string, string] {
  const titleString = strings.scenario.routes[route][routeDay as RouteDayName] ?? ""
  let dayString = ""

  if (isNaN(+day))
    dayString = strings.scenario.days[+day - 1] ?? ""
  else if ((day as string).length > 0)
    dayString = strings.scenario.routes['others'][day as RouteDayName<"others">] ?? ""

  return [titleString, dayString]
}