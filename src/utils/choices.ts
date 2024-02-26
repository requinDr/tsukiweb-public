import { Choice, LabelName } from "../types"
import { displayMode } from "./display"
import { preprocessText, resettable } from "./utils"
import { gameContext } from "./variables"
import history from "../utils/history"

export const [choicesContainer, resetChoices] = resettable({
  choices: [] as Choice[]
})

// <"text", *label> or <`text`, *label>
// w/ optional whitespace chars around ','
const choiceRegexp = /(?<text>"[^"]*"|`[^`]*`)\s*,\s*\*(?<label>\w+)/gm

export const commands = {
  'select': (arg: string)=> {
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
      console.error("no choice after scene", gameContext.label)
    choicesContainer.choices = choices
    displayMode.choice = true;
    console.debug(choices)
    history.onPageBreak("choice", choices)
    return {
      next: ()=>{}, // prevent continuing to next instruction
      cancel: ()=> { choicesContainer.choices = [] }
    }; // prevent processing next line
  }
}