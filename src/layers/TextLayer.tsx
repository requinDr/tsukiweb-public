import { useEffect, useState, memo, Fragment } from "react"
import moonIcon from '../assets/icons/icon_moon.svg'
import pageIcon from '../assets/icons/icon_bars.svg'
import { settings } from "../utils/settings"
import { SCREEN, displayMode } from "../utils/display"
import { resetSI, scriptInterface } from "../utils/text"
import useMousePointer from "@tsukiweb-common/hooks/useMousePointer"
import { observe, useObserved, useObserver } from "@tsukiweb-common/utils/Observer"
import { DivProps } from "@tsukiweb-common/types"
import { Bbcode, BBTypeWriter } from "@tsukiweb-common/utils/Bbcode"
import { gameContext } from "utils/gameContext"

export const icons: Record<"moon"|"page", string> = {
  "moon": moonIcon,
  "page": pageIcon
}

observe(displayMode, 'screen', resetSI, {filter: s => s != SCREEN.WINDOW})

type Props = { } & DivProps

const TextLayer = ({...props}: Props) => {

  const [ display ] = useObserved(displayMode, 'text')
  const [ lines, setLines ] = useState<string[]>([])
  const [ immediate ] = useObserved(scriptInterface, 'fastForward')
  const [ glyph ] = useObserved(scriptInterface, 'glyph')
  const mouseCursorVisible = useMousePointer()

  useEffect(()=> {
    if (glyph) {
      scriptInterface.onFinish?.()
      if (displayMode.graphics)
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
  }, gameContext, 'text')

  const {className, ...remaining_props} = props
  const classList = ['layer']
  if (!display || (lines.length == 0)) classList.push('hide')
  if (!mouseCursorVisible) classList.push('hide-mouse-pointer')
  if (className) classList.push(className)
  const [previousLines, lastLine] = [lines.slice(0, lines.length-1), lines[lines.length-1]]
  
  const glyphNode = glyph && <span className="cursor" id={glyph}><img src={icons[glyph]} alt={glyph} /></span>

  return (
    <div className={classList.join(' ')} {...remaining_props} id="layer-text">
      <div className="text-container">
        {previousLines.map((line, i) =>
        <Fragment key={i}>
          {line && <Bbcode text={line} />}
          <br/>
        </Fragment>)}

        {lastLine ?
          <BBTypeWriter key={gameContext.page*100 + lines.length}
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
}

export default memo(TextLayer)
