import { RefObject, useEffect, useRef, useState } from "react"
import { Choice, LabelName } from "../types"
import history from "../utils/history"
import { Bbcode } from "@tsukiweb-common/utils/Bbcode"
import { ScriptPlayer } from "script/ScriptPlayer"
import { preprocessText } from "@tsukiweb-common/utils/utils"



type SelectionCallback = (choice: Choice)=>void

//##############################################################################
//#region                       COMMAND HANDLERS
//##############################################################################

// <"text"|`text` , *label> (optional whitespace around ',')
const choiceRegexp = /(?<text>"[^"]*"|`[^`]*`)\s*,\s*\*(?<label>\w+)/gm

function processSelect(setChoices: (choices: Choice[])=>void,
                       onSelection: RefObject<SelectionCallback|undefined>,
                       arg: string, _cmd: string, script: ScriptPlayer,
                       onFinish: VoidFunction) {
//----- extract texts and labels -------
  const choices: Choice[] = []
  let match
  while ((match = choiceRegexp.exec(arg)) != null) {
    const {text, label} = match.groups ?? {}
    if (!text || !label)
      console.error(`Could not parse choices in "select ${arg}"`)
    // remove ` or " at beginning and end of text regexp label, trim text
    const trimmedText = text.substring(1, text.length-1).trim()
    choices.push({
      index: choices.length,
      str: preprocessText(trimmedText), 
      label: label.trim() as LabelName
    })
  }
  if (choices.length == 0)
    console.error(`canot parse choices ${arg}`)
  //console.debug(choices)
  setChoices(choices)
  history.onChoicePrompt(choices)

//----------- set callback -------------
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
  };
}

//#endregion ###################################################################
//#region                           COMPONENT
//##############################################################################

type Props = {
  script: ScriptPlayer
  display: boolean
}

const ChoicesLayer = ({script, display}: Props) => {
  const [choices, setChoices] = useState<Choice[]>([])
  const onSelection = useRef<SelectionCallback>(undefined)

  useEffect(()=> {
    script.setCommand('select',
      processSelect.bind(null, setChoices, onSelection))
  }, [script])

  if (!display || choices.length == 0)
    return <></>

  return (
    <div className="layer" id="layer-choices">
      <div className="choices-container">
        {choices.map((choice: Choice) =>
          <button key={choice.index} className="choice"
            onClick={()=> onSelection.current?.(choice)}>
            <Bbcode text={choice.str}/>
          </button>
        )}
      </div>
    </div>
  )
}

export default ChoicesLayer