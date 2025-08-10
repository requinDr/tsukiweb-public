import { useRef } from "react"
import SavesLayout from "../components/save/SavesLayout";
import classNames from "classnames";
import { useLanguageRefresh } from "hooks";


type Props = {
  display: boolean
  mode: null|'save'|'load'
  back: (saveLoaded: boolean)=>void
}

const SavesLayer = ({display, mode, back}: Props) => {
  const rootRef = useRef<HTMLDivElement>(null)
  useLanguageRefresh()
  
  return (
    <div id="layer-save"
      className={classNames("layer", {show: display})}
      ref={rootRef}
    >
      <div className="page-content">
        <SavesLayout variant={mode ?? 'save'} back={back} />
      </div>
    </div>
  )
}

export default SavesLayer
