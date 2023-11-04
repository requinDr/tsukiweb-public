import { useEffect, useState, memo, Fragment } from "react"
import moonIcon from '../assets/icons/icon_moon.svg'
import pageIcon from '../assets/icons/icon_bars.svg'
import { preprocessText, resettable } from "../utils/utils"
import { gameContext, settings } from "../utils/variables"
import { observe, useObserved, useObserver } from "../utils/Observer"
import history from "../utils/history"
import { SCREEN, displayMode } from "../utils/display"
import { PageContent } from "../types"
import { BBTypeWriter, Bbcode } from "../utils/Bbcode"

const icons: Record<"moon"|"page", string> = {
  "moon": moonIcon,
  "page": pageIcon
}

const [scriptInterface, resetSI] = resettable({
  text: "" as string,
  glyph: undefined as keyof typeof icons|undefined,
  fastForward: false as boolean,
  onFinish: undefined as VoidFunction|undefined
})

observe(displayMode, 'screen', resetSI, {filter: s => s != SCREEN.WINDOW})


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

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

type Props = { } & React.ComponentPropsWithoutRef<"div">

const TextLayer = memo(({...props}: Props) => {

  const [ display ] = useObserved(displayMode, 'text')
  const [ lines, setLines ] = useState<string[]>([])
  const [ immediate ] = useObserved(scriptInterface, 'fastForward')
  const [ glyph ] = useObserved(scriptInterface, 'glyph')

  useEffect(()=> {
    if (glyph) {
      scriptInterface.onFinish?.()
      if (!displayMode.text)
        displayMode.text = true
    }
  }, [glyph])

  useObserver((text)=> {
    const trimmed = text.trimEnd()
    if (trimmed.length == 0)
      setLines([])
    else {
      setLines(trimmed.split('\n'))
      if (!displayMode.text && text.length > 0)
        displayMode.text = true
    }
  }, scriptInterface, 'text')

  const {className, ...remaining_props} = props
  const classList = ['layer']
  if (!display || (lines.length == 0)) classList.push('hide')
  if (className) classList.push(className)
  const [previousLines, lastLine] = [lines.slice(0, lines.length-1), lines[lines.length-1]]
  
  const glyphNode = glyph && <span><img src={icons[glyph]} alt={glyph} id={glyph} className="cursor" /></span>

  return (
    <div className={classList.join(' ')} {...remaining_props} id="layer-text">
      <div className="text-container">
        {previousLines.map((line, i) =>
        <Fragment key={i}>
          {line && <Bbcode text={line} />}
          <br/>
        </Fragment>)}

        {lastLine ?
          <BBTypeWriter key={lines.length}
            charDelay={immediate ? 0 : settings.textSpeed}
            text={lastLine}
            hideTag="hide"
            onFinish={()=> { scriptInterface.onFinish?.() }}
            rootSuffix={glyphNode}/>
        : glyphNode
        }
        
      </div>
    </div>
  )
})

export default TextLayer
