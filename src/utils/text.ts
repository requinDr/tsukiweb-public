import { PageContent } from "../types"
import { preprocessText, resettable } from "./utils"
import { gameContext } from "./variables"
import { settings } from "./settings"
import history from "../utils/history"
import { icons } from "../layers/TextLayer"

export const [scriptInterface, resetSI] = resettable({
  text: "" as string,
  glyph: undefined as keyof typeof icons|undefined,
  fastForward: false as boolean,
  onFinish: undefined as VoidFunction|undefined
})

history.addListener(()=> {
  scriptInterface.text = ""
  scriptInterface.glyph = undefined
})

function appendText(text: string) {
  const lastPage = history.last.page as PageContent<"text">
  lastPage.text += text
  scriptInterface.text = lastPage.text
  scriptInterface.glyph = undefined
}

function onBreakChar(_: string, cmd: string, onFinish: VoidFunction) {
  let delay = 0
  switch(cmd) {
    case '@' :
      scriptInterface.glyph = "moon"
      delay = settings.autoClickDelay
      break
    case '\\' :
      scriptInterface.glyph = "page"
      delay = settings.nextPageDelay
      break
    default : throw Error(`unknown break char ${cmd}`)
  }
  return { next: ()=> {
    scriptInterface.glyph = undefined
    onFinish()
  }, autoPlayDelay: delay}
}

export const commands = {
  'br' : appendText.bind(null, "\n"),
  '@'  : onBreakChar,
  '\\' : onBreakChar,
  '`'  : (text:string, _: string, onFinish: VoidFunction)=> {
    if (text == '\n') { // line breaks are displayed instantly
      appendText('\n')
      return
    }
    text = preprocessText(gameContext.textPrefix + text)
    appendText(text)
    
    scriptInterface.onFinish = ()=> {
      scriptInterface.onFinish = undefined,
      scriptInterface.fastForward = false
      onFinish()
    }
    return {
      next: () => {
        scriptInterface.fastForward = true;
      }
    }
  },
  'textcolor': (color: string, _: string)=> {
    gameContext.textPrefix = `[color=${color}]`
  }
}