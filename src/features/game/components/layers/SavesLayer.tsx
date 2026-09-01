import { useRef } from "react"
import AnimatedHideActivityDiv from "@tsukiweb/common/ui-core/components/AnimatedHideActivityDiv";
import SavesView from "features/save/components/SavesView";


type Props = {
  mode: null|'save'|'load'
  onBack: (saveLoaded: boolean)=>void
}

const SavesLayer = ({mode, onBack}: Props) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const lastMode = useRef<NonNullable<Props['mode']>>(mode ?? 'save')
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
		<SavesView key={lastMode.current} variant={lastMode.current} onBack={onBack} />
    </AnimatedHideActivityDiv>
  )
}

export default SavesLayer
