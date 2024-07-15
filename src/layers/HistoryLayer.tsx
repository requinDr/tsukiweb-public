import { useEffect, useRef } from 'react';
import { displayMode, isViewAnyOf } from '../utils/display';
import { SaveState, loadSaveState } from "../utils/savestates";
import history from '../utils/history';
import script from '../utils/script';
import { strings } from '../translation/lang';
import PageElement from '../components/molecules/PageElement';
import FixedFooter from '@tsukiweb-common/ui-core/components/FixedFooter';
import MenuButton from '@tsukiweb-common/ui-core/components/MenuButton';
import { useObserved, useObserver } from '@tsukiweb-common/utils/Observer';
import { addEventListener } from '@tsukiweb-common/utils/utils';

type Props = {
  [key: string] : any // other properties to apply to the root 'div' element of the component
}
const HistoryLayer = (props: Props) => {
  const [ display, setDisplay ] = useObserved(displayMode, 'history')
  const rootRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)

  useObserver(()=> {
    if (rootRef.current?.contains(document.activeElement))
      (document.activeElement as HTMLElement).blur?.()
  }, displayMode, "history", {filter: d=>!d})

  useEffect(() => {
    //on mouse wheel up display history
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey)
        return
      if (e.deltaY < 0 && !display && isViewAnyOf("text", "graphics", "dialog")) {
        if (!history.empty) // at least one element in the iterator
          setDisplay(true)
        script.autoPlay = false
      } else if (e.deltaY > 0 && display && historyRef.current?.scrollHeight == historyRef.current?.clientHeight) {
        setDisplay(false)
      }
      //TODO: scroll down: close if scroll past bottom
    }
    return addEventListener({event: 'wheel', handler: handleWheel})
  })

  useEffect(() => {
    //on right click, when history is displayed, hide history
    const handleContextMenu = (_e: MouseEvent) => {
      if (display) setDisplay(false)
    }
    return addEventListener({event: 'contextmenu', handler: handleContextMenu})
  })

  useEffect(() => {
    //on escape, when history is displayed, hide history
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key == "Escape" && display) setDisplay(false)
    }
    return addEventListener({event: 'keydown', handler: handleKeyDown})
  })

  useEffect(() => {
    //when scrolled to the bottom of history, hide history
    const handleScroll = (e: any) => {
      const bottom = e.target.scrollHeight - Math.round(e.target.scrollTop) === e.target.clientHeight
      if (bottom) {
        setDisplay(false)
      }
    }
    return addEventListener({event: 'scroll', handler: handleScroll, element: historyRef.current})
  })

  useEffect(() => {
    //scroll to the bottom of history
    if (display) {
      const historyElement = historyRef.current
      historyElement!.scrollTop = historyElement!.scrollHeight - historyElement!.clientHeight - 1
    }
  }, [display])

  function onClick(saveState: SaveState) {
    setDisplay(false)
    loadSaveState(saveState)
  }

  const {className, ...otherProps} = props
  const classList = ["layer"]
  if (display)
    classList.push("show")
  if (className)
    classList.push(className)

  return (
    <div className={classList.join(' ')} {...otherProps} ref={rootRef} id="layer-history">
      <div id="history" ref={historyRef}>
        <div className="text-container">
          {/* previous pages lines */}
          {Array.from(history, (page, i) =>
            <PageElement key={i} saveState={page} onLoad={onClick} />
          )}
        </div>
      </div>

      <FixedFooter>
        <MenuButton onClick={() => setDisplay(false)}>
          {strings.close}
        </MenuButton>
      </FixedFooter>
    </div>
  )
}


export default HistoryLayer
