import { SpritePos } from "../components/molecules/GraphicsGroup";
import { observe } from "./Observer";
import { displayMode } from "./display";
import { wordImage } from "./lang";
import { splitFirst, objectMatch, resettable } from "./utils";
import { settings, gameContext } from "./variables";

export const [transition, resetTransition] = resettable({
  effect: "",
  duration: 0,
  pos: "a" as SpritePos|'a',
})

export function endTransition() {
  transition.duration = 0
}

export function extractImage(image: string) {
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

export function getTransition(type: string, skipTransition = false) {
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

export function applyChange(pos: SpritePos, image: string, type: string, onFinish: VoidFunction) {

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

export function clearAllSprites() {
  const graphics = gameContext.graphics
  const changed = (graphics.l != "" || graphics.c != "" || graphics.r != "")
  graphics.l = ""
  graphics.c = ""
  graphics.r = ""
  return changed
}

export function setSprite(pos: SpritePos|'a', image: string): boolean {
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