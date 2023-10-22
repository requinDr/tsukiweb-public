import { Fragment, useRef } from "react"
import { KeymapKeyFilter, inGameKeymap } from "../../utils/KeyMap"
import strings, { useLanguageRefresh } from "../../utils/lang"
import { bb } from "../../utils/Bbcode"

type KeyMapEntry = [string, typeof inGameKeymap[keyof typeof inGameKeymap]]

function convertAction([action, keys]: KeyMapEntry) : [string, KeymapKeyFilter[]] {
  return [
    action,
    Array.isArray(keys) ?
      keys.filter(x=>x.constructor != Function) as KeymapKeyFilter[]
    : [keys]
  ]
}

const ConfigControlsTab = () => {
  useLanguageRefresh()
  const controlStrings = strings.config.controls as Record<string, string>
  const keymap = useRef(
      Object.entries(inGameKeymap)
            .filter(([action, _])=> Object.hasOwn(controlStrings, action))
            .map(convertAction))
  return (
    <section>
      {keymap.current.map(([action, keys], i)=> 
        <div key={i} className="keyMap">
          <div className="action">{bb(controlStrings[action])}</div>
          {keys.map(({code, key, ctrlKey, altKey, shiftKey, repeat}, j)=>
            <div key={`${code || key}`} className="keyItem">
                {ctrlKey ? "Ctrl + " : ""}
                {altKey ? "Alt + " : ""}
                {shiftKey ? "Shift + " : ""}
                {code || key}
                {repeat != undefined && (
                  repeat && <>
                    &nbsp;
                    <span className="info">
                      {bb(controlStrings["_hold"])}
                    </span>
                  </>
                )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default ConfigControlsTab