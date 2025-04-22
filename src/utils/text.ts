import { gameContext } from "./gameContext"
import { settings } from "./settings"
import { icons } from "../layers/TextLayer"
import { resettable, preprocessText } from "@tsukiweb-common/utils/utils"
import { observe } from "@tsukiweb-common/utils/Observer"

export const [scriptInterface, resetSI] = resettable({
  glyph: undefined as keyof typeof icons|undefined,
  fastForward: false as boolean,
  onFinish: undefined as VoidFunction|undefined
})

observe(gameContext, 'text', ()=> {
  scriptInterface.glyph = undefined
})

function onClickWait(_txt: string, _cmd: string, onFinish: VoidFunction) {
  scriptInterface.glyph = "moon"
  return { next: ()=> {
    scriptInterface.glyph = undefined
    onFinish()
  }, autoPlayDelay: settings.autoClickDelay }
}

function onPageWait(_txt: string, _cmd: string, onFinish: VoidFunction) {
  scriptInterface.glyph = "page"
  return { next: ()=> {
    scriptInterface.glyph = undefined // this might be redundant
    gameContext.page++
    onFinish()
  }, autoPlayDelay: settings.nextPageDelay }
}

function onText(text: string, _cmd: string, onFinish: VoidFunction) {
  if (text == '\n') { // line breaks are displayed instantly
    gameContext.text += '\n'
    return
  }
  text = preprocessText(gameContext.textPrefix + text)
  gameContext.text += text
  
  scriptInterface.onFinish = ()=> {
    scriptInterface.onFinish = undefined,
    scriptInterface.fastForward = false
    onFinish()
  }
  return {
    next: () => {
      scriptInterface.fastForward = true;
    },
  }
}

export const commands = {
  'br' : ()=>{ gameContext.text += "\n" },
  '@'  : onClickWait,
  '\\' : onPageWait,
  '`'  : onText,
  'textcolor': (color: string)=> {
    gameContext.textPrefix = `[color=${color}]`
  }
}