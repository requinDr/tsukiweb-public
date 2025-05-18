import { useRef, useState } from "react"
import { displayMode } from "../utils/display"
import SavesLayout from "../components/SavesLayout";
import { useLanguageRefresh } from "components/hooks/useLanguageRefresh";
import { useObserver } from "@tsukiweb-common/utils/Observer";
import classNames from "classnames";


type Props = {
  mode: null|'save'|'load'
  back: (saveLoaded: boolean)=>void
}

const SavesLayer = ({mode, back}: Props) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const variant = useRef<'save'|'load'>(mode!=null ? mode : 'save')
  const display = useRef<boolean>(false)
  useLanguageRefresh()
  
  return (
    <div id="layer-save"
      className={classNames("layer", {show: mode != null})}
      ref={rootRef}
    >
      <div className="page-content">
        <SavesLayout variant={mode ?? 'save'} back={back} />
      </div>
    </div>
  )
}

export default SavesLayer
