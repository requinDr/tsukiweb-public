import { useEffect, useState, memo, Fragment, useRef, RefObject, useCallback } from "react"
import moonIcon from '@assets/icons/icon_moon.svg'
import pageIcon from '@assets/icons/icon_bars.svg'
import { settings } from "../utils/settings"
import { ScriptPlayer } from "script/ScriptPlayer"
import { useObserved, useObserver } from "@tsukiweb-common/utils/Observer"
import { DivProps } from "@tsukiweb-common/types"
import { Bbcode, BBTypeWriter } from "@tsukiweb-common/utils/Bbcode"
import { preprocessText } from "@tsukiweb-common/utils/utils"
import { useAutoScroll, useEventState, useMousePointer } from "@tsukiweb-common/hooks"
import { EndLineIndicator, FfwIndicator } from "@tsukiweb-common/ui-core"

type Glyph = "line"|"page"
const icons: Record<Glyph, string> = {
  "line": moonIcon,
  "page": pageIcon
}

function onGlyph(setGlyph: (glyph: Glyph|null)=>void,
                 _a: string, cmd: string, _s: ScriptPlayer,
                onFinish: VoidFunction) {
  let glyph: Glyph, delay: number
  switch (cmd) {
    case '@' : glyph = "line"; delay = settings.autoClickDelay; break
    case '\\': glyph = "page"; delay = settings.nextPageDelay; break
    default : throw Error(`Unexpected glyph command ${cmd}.`)
  }
  setGlyph(glyph)
  const next = ()=> {
    setGlyph(null)
    onFinish()
  }
  return { next: next, autoPlayDelay: delay }
}

function onText(skip: VoidFunction,
                onFinishRef: RefObject<VoidFunction | undefined>,
                text: string, _cmd: string, script: ScriptPlayer,
                onFinish: VoidFunction) {
  if (_cmd == "br" || text == '\n') { // line breaks are displayed instantly
    script.text += '\n'
    return
  }
  text = preprocessText(script.textPrefix + text)
  script.text += text
  onFinishRef.current = onFinish
  return { next: ()=> {
    skip()
  }}
}

function onTextColor(color: string, _c: string, script: ScriptPlayer) {
  script.textPrefix = `[color=${color}]`
}

function onTextBox(textbox: string, _cmd: string, script: ScriptPlayer) {
  script.textBox = textbox as 'adv' | 'nvl'
}

type Props = DivProps & {
  script: ScriptPlayer
  display: boolean
  isTopLayer: boolean
  charDelay?: number
  textbox?: "nvl"|"adv"
}

const TextLayer = ({ script, display, isTopLayer,
                     charDelay = settings.textSpeed, ...props }: Props) => {

  const [lines, setLines] = useState<string[]>([])
  const [glyph, setGlyph] = useState<Glyph|null>(null)
  const [textBox] = useObserved(script, 'textBox')
  const [immediate, setImmediate] = useState<boolean>(false)
  const [isFfw] = useEventState(script, "ffwStart", "ffwStop")
  const onFinishRef = useRef<VoidFunction>(undefined)
  const textContainerRef = useAutoScroll()
  const mouseCursorVisible = useMousePointer()

  const skip = useCallback(() => setImmediate(true), [])

  useEffect(() => {
    const resetGlyph = () => setGlyph(null)
    script.addEventListener('pageStart', resetGlyph)
    return () => {
      script.removeEventListener('pageStart', resetGlyph)
    }
  }, [script])

  useEffect(()=> {
    const _onGlyph = onGlyph.bind(null, setGlyph)
    const _onText = onText.bind(null, skip, onFinishRef)
    script.setCommands({
      '`' : _onText, '@' : _onGlyph,
      'br': _onText, '\\': _onGlyph,
      'textcolor': onTextColor,
      'textbox': onTextBox,
    })
  }, [script, skip])

  useObserver(text => {
    const trimmed = text.trimEnd()
    setLines(trimmed ? trimmed.split('\n') : [])
  }, script, 'text')

  const {className, ...remaining_props} = props
  const classList = ['layer']
  if (!display || (lines.length == 0 && !glyph))
    classList.push('hide')
  if (!mouseCursorVisible)
    classList.push('hide-mouse-pointer')
  if (textBox === "adv")
    classList.push('adv')
  if (className)
    classList.push(className)

  const lastLine = lines.at(-1)
  const previousLines = lines.slice(0, -1)
  
  const glyphNode = glyph && <EndLineIndicator icon={icons[glyph]} glyph={glyph} hide={!isTopLayer} />
  const twKey = `${script.uid}-${script.currentPage}-${lines.length}`

  return (
    <div className={classList.join(' ')} {...remaining_props} id="layer-text" aria-hidden={!display}>
      <div className="text-container" ref={textContainerRef}>
        {previousLines.map((line, i) =>
          <Fragment key={i}>
            {line && <Bbcode text={line} />}
            <br/>
          </Fragment>
        )}

        {lastLine ?
          <BBTypeWriter key={twKey}
            charDelay={immediate ? 0 : charDelay}
            paused={!display}
            text={lastLine}
            hideTag="hide"
            onFinish={()=> {
              setImmediate(false);
              onFinishRef.current?.()
            }}
            rootSuffix={glyphNode}/>
        : glyphNode
        }
      </div>

      {isFfw && <FfwIndicator />}
    </div>
  )
}

export default memo(TextLayer)
