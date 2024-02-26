import { Fragment, memo, useEffect, useRef } from 'react';
import { addEventListener } from "../utils/utils";
import { displayMode, isViewAnyOf } from '../utils/display';
import { SaveState, loadSaveState } from "../utils/savestates";
import { useObserved, useObserver, } from '../utils/Observer';
import history from '../utils/history';
import script from '../utils/script';
import { strings, phaseTexts } from '../utils/lang';
import { PageContent } from '../types';
import { getSceneTitle } from '../utils/scriptUtils';
import { Bbcode, bb } from '../utils/Bbcode';
import MenuButton from '../components/atoms/MenuButton';

const PageElement = memo(({saveState, onLoad}: {saveState: SaveState, onLoad: (ss: SaveState)=>void})=> {
  if (saveState.page == undefined)
    return <></>
  const {contentType, ...content} = saveState.page
  let displayContent
  switch(contentType) {
    case "text" :
      const {text} = content as PageContent<"text">
      displayContent = text.split('\n').map((line, i) =>
        <Fragment key={i}>
          {i > 0 && <br/>}
          <Bbcode text={line}/>
        </Fragment>
      )
      break
    case "choice":
      const {choices, selected} = content as PageContent<"choice">  
      displayContent = <>{choices.map(({str, index})=>
        <Fragment key={index}>{index > 0 && <br/>}
          <span className={`choice ${index==selected ? 'selected' : ''}`} key={index}>
            {str}
          </span>
        </Fragment>
      )}</>
      break
    case "skip" :
      const {scene} = content as PageContent<"skip">
      const sceneTitle = getSceneTitle(scene)??""
      displayContent = <span className='skip'>
        {bb(strings.history.skipped.replace('$0', sceneTitle))}
      </span>
      break
    case "phase" :
      const {route, routeDay, day} = saveState.context.phase ?? {}
      const [phaseTitle, phaseDay] = phaseTexts(route ?? "", routeDay ?? "", day ?? 0)
      displayContent = <span className='phase'>
        {phaseTitle && bb(phaseTitle)}
        {phaseDay && <><br/>{bb(phaseDay)}</>}
      </span>
      break
    default :
      throw Error(`Unknown page type ${contentType}`)
  }
  return (
  <>
    <hr {...{"page-type": contentType}}/>
    {saveState &&
      <MenuButton onClick={onLoad.bind(null,saveState)} className='load'>
        {strings.history.load}
      </MenuButton>
    }
    {displayContent}
  </>
  )
})

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
          {/* lignes des pages précédentes */}
          {Array.from(history, (page, i) =>
            <PageElement key={i} saveState={page} onLoad={onClick} />
          )}
        </div>
      </div>

      <footer>
        <button onClick={() => setDisplay(false)}>{strings.history.close}</button>
      </footer>
    </div>
  )
}


export default HistoryLayer
