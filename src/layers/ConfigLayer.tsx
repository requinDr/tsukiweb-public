import { useEffect, useRef, useState } from "react"
import { displayMode } from "../utils/display"
import { addEventListener } from "../utils/utils"
import { useObserved, useObserver } from '../utils/Observer';
import ConfigLayout from "../components/ConfigLayout";


function back() {
  displayMode.config = false
}

const ConfigLayer = () => {
  const [display] = useObserved(displayMode, 'config')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!display && rootRef.current?.contains(document.activeElement))
      (document.activeElement as HTMLElement).blur?.()

  }, [display])
  
  return (
    <div className={`layer ${display ? "show" : ""}`} ref={rootRef} id="layer-config">
      <div className="page-content">
        <ConfigLayout back={back} />
      </div>
    </div>
  )
}

export default ConfigLayer
