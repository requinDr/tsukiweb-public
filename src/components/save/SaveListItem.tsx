import strings from "../../utils/lang"
import { QUICK_SAVE_ID, SaveState } from "../../utils/savestates"
import { GraphicsGroup } from "../GraphicsComponent"
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
  const isQuickSave = id === QUICK_SAVE_ID

  return (
    <button className={`save-container ${id==focusedSave ? "active" : ""}`}
      onClick={onSelect.bind(null, id)}
      {...(isQuickSave ? {'quick-save':''} : {})}
      {...props}>
      <GraphicsGroup images={saveState.graphics ?? saveState.context.graphics ?? {bg: ""}} resolution="sd"/>

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