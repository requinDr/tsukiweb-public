import { useEffect, useState, memo, Fragment, useRef, RefObject } from "react"
import moonIcon from '@assets/icons/icon_moon.svg'
import pageIcon from '@assets/icons/icon_bars.svg'
import { settings } from "../utils/settings"
import { ScriptPlayer } from "script/ScriptPlayer"
import useMousePointer from "@tsukiweb-common/hooks/useMousePointer"
import { useObserved, useObserver } from "@tsukiweb-common/utils/Observer"
import { DivProps } from "@tsukiweb-common/types"
import { Bbcode, BBTypeWriter } from "@tsukiweb-common/utils/Bbcode"
import { preprocessText } from "@tsukiweb-common/utils/utils"

type Glyph = "moon"|"page"
export const icons: Record<Glyph, string> = {
  "moon": moonIcon,
  "page": pageIcon
}

function onGlyph(setGlyph: (glyph: Glyph|null)=>void,
                 _a: string, cmd: string, _s: ScriptPlayer,
                onFinish: VoidFunction) {
  let glyph: Glyph, delay: number
  switch (cmd) {
    case '@' : glyph = "moon"; delay = settings.autoClickDelay; break
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

type Props = {
  script: ScriptPlayer
  display?: boolean|'auto'
  charDelay?: number
  textbox?: "nvl"|"adv"
} & DivProps

function onTextBox(textbox: string, _cmd: string, script: ScriptPlayer) {
  script.textBox = textbox as 'adv' | 'nvl'
}

const TextLayer = ({ script, display = 'auto',
                     charDelay = settings.textSpeed, ...props }: Props) => {

  const [ lines, setLines ] = useState<string[]>([])
  const [ glyph, setGlyph ] = useState<'moon'|'page'|null>(null)
  const [ textBox ] = useObserved(script, 'textBox')
  const [ immediate, setImmediate ] = useState<boolean>(false)
  const onFinishRef = useRef<VoidFunction|undefined>(undefined)
  const mouseCursorVisible = useMousePointer()

  const skip = setImmediate.bind(null, true) as VoidFunction

  useEffect(()=> {
    const _onGlyph = onGlyph.bind(null, setGlyph)
    const _onText = onText.bind(null, skip, onFinishRef)
    script.setCommands({
      '`' : _onText, '@' : _onGlyph,
      'br': _onText, '\\': _onGlyph,
      'textcolor': onTextColor,
      'textbox': onTextBox,
    })
  }, [script])

  useObserver((text)=> {
    const trimmed = text.trimEnd()
    if (trimmed.length == 0)
      setLines([])
    else {
      setLines(trimmed.split('\n'))
    }
  }, script, 'text')

  const {className, ...remaining_props} = props
  const classList = ['layer']
  if (!display || (display == 'auto' && lines.length == 0 && !glyph))
    classList.push('hide')
  if (!mouseCursorVisible)
    classList.push('hide-mouse-pointer')
  if (textBox === "adv")
    classList.push('adv')
  if (className)
    classList.push(className)

  const [previousLines, lastLine] = [
    lines.slice(0, lines.length-1),
    lines[lines.length-1]
  ]
  
  const glyphNode = glyph && (
    <span className="cursor" id={glyph}>
      <img src={icons[glyph]} alt={glyph} />
    </span>)
  const twKey = script.uid*1000 + script.currentPage*100 + lines.length
  return (
    <div className={classList.join(' ')} {...remaining_props} id="layer-text">
      <div className="text-container">
        {previousLines.map((line, i) =>
        <Fragment key={i}>
          {line && <Bbcode text={line} />}
          <br/>
        </Fragment>)}

        {lastLine ?
          <BBTypeWriter key={twKey}
            charDelay={immediate ? 0 : settings.textSpeed}
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
    </div>
  )
}

export default memo(TextLayer)
