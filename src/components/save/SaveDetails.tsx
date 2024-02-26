import { Tooltip } from "react-tooltip"
import { SaveState, exportSave } from "../../utils/savestates"
import { savePhaseTexts } from "../SavesLayout"
import { MdDeleteOutline, MdOutlineFileDownload } from "react-icons/md"
import GraphicsGroup from "../molecules/GraphicsGroup"

type SaveDetailsProps = {
  id?: number, saveState?: SaveState, deleteSave: (id: number)=>void,
  [key:string]: any
}
const SaveDetails = ({id, saveState, deleteSave, ...props}: SaveDetailsProps)=> {
  const [phaseTitle, phaseDay] = saveState ? savePhaseTexts(saveState) : ["", ""]

  return (
    <div className="info" {...props}>
      <GraphicsGroup images={saveState?.graphics ?? saveState?.context.graphics ?? {bg:"notreg"}} />
      
      {id != undefined && saveState != undefined &&
        <div className="deta">
          {phaseTitle && <div>{phaseTitle}</div>}
          {phaseDay && <div>{phaseDay}</div>}

          <div className="actions">
            <Tooltip id="tooltip" className="tooltip" delayShow={800} />
            <button onClick={deleteSave.bind(null, id)}
              data-tooltip-id="tooltip" data-tooltip-content="Delete">
              <MdDeleteOutline />
            </button>
            <button onClick={() => exportSave([id])}
              data-tooltip-id="tooltip" data-tooltip-content="Download">
              <MdOutlineFileDownload />
            </button>
          </div>
        </div>
      }
    </div>
  )
}

export default SaveDetails