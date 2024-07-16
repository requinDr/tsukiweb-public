import { useEffect, useRef, useState } from "react"
import { displayMode } from "../utils/display"
import SavesLayout from "../components/SavesLayout";
import { useLanguageRefresh } from "components/hooks/useLanguageRefresh";
import { useObserver } from "@tsukiweb-common/utils/Observer";
import { addEventListener } from "@tsukiweb-common/utils/utils";
import classNames from "classnames";


function back() {
  displayMode.save = false
  displayMode.load = false
}

const SavesLayer = () => {
  const [display, setDisplay] = useState(displayMode.saveScreen)
  const [variant, setVariant] = useState(displayMode.savesVariant as Exclude<typeof displayMode.savesVariant, "">)
  const rootRef = useRef<HTMLDivElement>(null)
  useLanguageRefresh()

  useObserver((display)=> {
    setDisplay(display)
    if (display)
      setVariant(displayMode.savesVariant as "save"|"load")
    else if (rootRef.current?.contains(document.activeElement))
      (document.activeElement as HTMLElement).blur?.()
  }, displayMode, "saveScreen")

  useEffect(() => {
    const handleContextMenu = (_e: MouseEvent) => {
      displayMode.saveScreen = false
    }
    return addEventListener({event: 'contextmenu', handler: handleContextMenu})
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key == "Escape") {
        displayMode.save = false
        displayMode.load = false
      }
    }
    return addEventListener({event: 'keydown', handler: handleKeyDown})
  }, [])
  
  return (
    <div id="layer-save"
      className={classNames("layer", {show: display})}
      ref={rootRef}
    >
      <div className="page-content">
        <SavesLayout variant={variant} back={back} />
      </div>
    </div>
  )
}

export default SavesLayer
