import { useEffect, useRef, useState } from "react"
import { displayMode } from "../utils/display"
import script from "../utils/script"
import { strings } from "../translation/lang"
import { useObserver } from "@tsukiweb-common/utils/Observer"
import classNames from "classnames"
import { bb } from "@tsukiweb-common/utils/Bbcode"

const SkipLayer = () => {
  const [display, setDisplay] = useState<boolean>(false)
  const [sceneTitle, setSceneTitle] = useState<string>()
  const skipConfirm = useRef<(skip:boolean)=>void>()

  useEffect(()=> {

    script.onSkipPrompt = (title: string|undefined,
                           confirm: (skip: boolean)=>void)=> {
      displayMode.skip = true
      skipConfirm.current = confirm
      setSceneTitle(title)
    }
    script.onSkipCancel = ()=> {
      displayMode.skip = false
      skipConfirm.current = undefined
    }
  }, [])
  useObserver(()=> {
    if (displayMode.skip && skipConfirm.current == undefined)
      displayMode.skip = false
    else setDisplay(displayMode.skip)
  }, displayMode, 'skip')

  function onSelection(skip: boolean) {
    displayMode.skip = false
    skipConfirm.current?.(skip)
    skipConfirm.current = undefined
  }
  const handleYes = onSelection.bind(null, true)

  const handleNo = onSelection.bind(null, false)

  return (
    <div id="skip-layer"
      className={classNames("layer", {show: display})}
    >
      <div className="skip-modal">
        <div className="title">
          {sceneTitle ?<>
            {bb(strings.game["skip-named"][0])}
            <div className="scene-title">{bb(sceneTitle)}</div>
            {bb(strings.game["skip-named"][1])}  
          </> : <>
            {bb(strings.game["skip-unnamed"])}
          </>}
        </div>

        <div className="buttons">
          <button onClick={handleYes}>{strings.yes}</button>
          <div className="separator" />
          <button onClick={handleNo}>{strings.no}</button>
        </div>
      </div>
    </div>
  )
}

export default SkipLayer