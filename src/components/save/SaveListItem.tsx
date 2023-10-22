import strings from "../../utils/lang"
import { QUICK_SAVE_ID, SaveState } from "../../utils/savestates"
import { graphicElements } from "../GraphicsComponent"
import SaveSummary from "./SaveSummary"

type SaveListItemProps = {
  id: number,
  saveState: SaveState,
  onSelect: (id: number)=>void,
  focusedSave?: number,
  [key: string]: any
}
const SaveListItem = ({id, saveState, onSelect, focusedSave, ...props}: SaveListItemProps)=> {
  const date = new Date(saveState.date as number)
  
  return (
    <button className={`save-container ${id==focusedSave ? "active" : ""}`}
      onClick={onSelect.bind(null, id)}
      {...(id==QUICK_SAVE_ID ? {'quick-save':''} : {})}
      {...props}>
      
      <div className={`graphics ${saveState.context.monochrome ? "monochrome" : ""}`}>
        {graphicElements(saveState.graphics ?? saveState.context.graphics ?? {bg: ""}, {}, 'sd')}
      </div>

      <div className="deta">
        <time dateTime={date.toISOString()} className="date">
          <b>{date.toLocaleDateString(strings.locale)}</b> {date.toLocaleTimeString(strings.locale)}
        </time>

        <div className="line">
          <SaveSummary saveState={saveState}/>
        </div>
      </div>
    </button>
  )
}

export default SaveListItem