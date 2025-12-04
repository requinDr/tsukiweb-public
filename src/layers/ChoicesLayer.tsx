import { memo, RefObject, useEffect, useRef, useState } from "react"
import { Choice, LabelName } from "../types"
import history from "../utils/history"
import { Bbcode } from "@tsukiweb-common/utils/Bbcode"
import { ScriptPlayer } from "script/ScriptPlayer"
import { preprocessText } from "@tsukiweb-common/utils/utils"
import { strings } from "../translation/lang"
import { Button } from "@tsukiweb-common/ui-core"
import { audio } from "utils/audio"
import { InGameLayersHandler } from "utils/display"


type SelectionCallback = (choice: Choice)=>void

//##############################################################################
//#region                       COMMAND HANDLERS
//##############################################################################

function getChoiceText(trimmedText: string): string {
  const choiceIndex = parseInt(trimmedText)
  if (!isNaN(choiceIndex) && choiceIndex >= 0 && choiceIndex < strings.choices.length) {
    const translatedChoice = strings.choices[choiceIndex]
    if (translatedChoice !== undefined) {
      return translatedChoice
    }
  }
  return trimmedText
}

// <"text"|`text` , *label> (optional whitespace around ',')
const choiceRegexp = /(?<text>"[^"]*"|`[^`]*`)\s*,\s*\*(?<label>\w+)/gm

function processSelect(setChoices: (choices: Choice[])=>void,
                       onSelection: RefObject<SelectionCallback|undefined>,
                       arg: string, _cmd: string, script: ScriptPlayer,
                       onFinish: VoidFunction) {
  const choices: Choice[] = []
  let match
  while ((match = choiceRegexp.exec(arg)) != null) {
    const {text, label} = match.groups ?? {}
    if (!text || !label) {
      console.error(`Could not parse choices in "select ${arg}"`)
      continue
    }
    // remove ` or " at beginning and end of text regexp label, trim text
    const trimmedText = text.slice(1, -1).trim()
    const choiceText = getChoiceText(trimmedText)
    
    choices.push({
      index: choices.length,
      str: preprocessText(choiceText), 
      label: label.trim() as LabelName
    })
  }

  if (choices.length == 0)
    console.error(`canot parse choices ${arg}`)
  
  setChoices(choices)
  history.onChoicePrompt(choices)

  onSelection.current = (choice)=> {
    //console.debug(choice)
    script.setNextLabel(choice.label)
    script.skipCurrentBlock()
    onSelection.current = undefined
    setChoices([])
    onFinish()
    history.onChoiceSelected(choice.index)
  }
  return {
    next: ()=>{}, // prevent continuing to next instruction
  }
}

//#endregion ###################################################################
//#region                           COMPONENT
//##############################################################################

type Props = {
  script: ScriptPlayer
  display: boolean
  navigable: boolean
}

const ChoicesLayer = ({script, display, navigable}: Props) => {
  const [choices, setChoices] = useState<Choice[]>([])
  const onSelection = useRef<SelectionCallback|undefined>(undefined)

  useEffect(()=> {
    script.setCommand('select',
      processSelect.bind(null, setChoices, onSelection))
  }, [script])

  if (!display || choices.length == 0) return null

  return (
    <div className="layer" id="layer-choices">
      <div className="choices-container">
        {choices.map((choice, i) =>
          <Button
            key={choice.index}
            variant={null}
            className="choice"
            onClick={() => onSelection.current?.(choice)}
            audio={audio}
            hoverSound="tick"
            clickSound="impact"
            //i-0.5 to place cursor on second choice when pressing down
            {...(navigable && {'nav-y': i-0.5})}
          >
            <Bbcode text={choice.str} />
          </Button>
        )}
      </div>
    </div>
  )
}

export default memo(ChoicesLayer)