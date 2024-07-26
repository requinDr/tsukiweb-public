import { useState } from "react"
import { Choice, PageContent } from "../types"
import script from "../utils/script"
import { SCREEN, displayMode } from "../utils/display"
import history from "../utils/history"
import { choicesContainer, resetChoices } from "../utils/choices"
import { observe, useObserver } from "@tsukiweb-common/utils/Observer"
import { Bbcode } from "@tsukiweb-common/utils/Bbcode"

observe(displayMode, 'screen', resetChoices, {filter: s => s != SCREEN.WINDOW})

const ChoicesLayer = () => {
  const [display, setDisplay] = useState<boolean>(false)
  const [choices, setChoices] = useState<Choice[]>([])

  function updateDisplay() {
    if (displayMode.choice && choicesContainer.choices.length == 0)
      displayMode.choice = false
    else setDisplay(displayMode.choice)
  }

  useObserver(updateDisplay, displayMode, 'choice')
  useObserver((choices)=> {
    setChoices(choices)
    updateDisplay()
  }, choicesContainer, 'choices')

  const handleSelect = (choice: Choice) => {
    console.debug(choice)
    const lastPage = history.last?.page
    if (lastPage?.contentType == "choice")
      (lastPage as PageContent<"choice">).selected = choice.index
    script.moveTo(choice.label)
    choicesContainer.choices = []
  }

  if (!display) return <></>

  return (
    <div className="layer" id="layer-choices">
      <div className="choices-container">
        {choices.map((choice: Choice, i:any) =>
          <button key={i} className="choice" onClick={()=> handleSelect(choice)}>
            <Bbcode text={choice.str}/>
          </button>
        )}
      </div>
    </div>
  )
}

export default ChoicesLayer