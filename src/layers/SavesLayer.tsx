import { useRef } from "react"
import SavesLayout from "../components/save/SavesLayout";
import { useLanguageRefresh } from "hooks";
import AnimatedHideActivityDiv from "@tsukiweb-common/ui-core/components/AnimatedHideActivityDiv";


type Props = {
  mode: null|'save'|'load'
  back: (saveLoaded: boolean)=>void
}

const SavesLayer = ({mode, back}: Props) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const lastMode = useRef<NonNullable<Props['mode']>>(mode ?? 'save')
  useLanguageRefresh()
  if (mode != null)
    lastMode.current = mode
  
  return (
    <AnimatedHideActivityDiv
      show={mode != null}
      showProps={{className: "show"}}
      id="layer-save"
      className="layer"
      ref={rootRef}
    >
      <div className="page-content">
        <SavesLayout variant={lastMode.current} back={back} />
      </div>
    </AnimatedHideActivityDiv>
  )
}

export default SavesLayer
