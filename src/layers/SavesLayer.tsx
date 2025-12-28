import { useRef } from "react"
import SavesLayout from "../components/save/SavesLayout";
import { useLanguageRefresh } from "hooks";
import AnimatedHideActivityDiv from "@tsukiweb-common/ui-core/components/AnimatedHideActivityDiv";


type Props = {
  display: boolean
  mode: null|'save'|'load'
  back: (saveLoaded: boolean)=>void
}

const SavesLayer = ({display, mode, back}: Props) => {
  const rootRef = useRef<HTMLDivElement>(null)
  useLanguageRefresh()
  
  return (
    <AnimatedHideActivityDiv
      show={display}
      showProps={{className: "show"}}
      id="layer-save"
      className="layer"
      ref={rootRef}
    >
      <div className="page-content">
        <SavesLayout variant={mode ?? 'save'} back={back} />
      </div>
    </AnimatedHideActivityDiv>
  )
}

export default SavesLayer
