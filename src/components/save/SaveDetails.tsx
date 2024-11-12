import { Tooltip } from "react-tooltip"
import { SaveState, exportSave } from "../../utils/savestates"
import { savePhaseTexts } from "../SavesLayout"
import { MdDeleteOutline, MdOutlineFileDownload } from "react-icons/md"
import GraphicsGroup from "../molecules/GraphicsGroup"
import PageSection from "@tsukiweb-common/ui-core/layouts/PageSection"

type SaveDetailsProps = {
	id?: number, saveState?: SaveState, deleteSave: (id: number)=>void,
	[key:string]: any
}
const SaveDetails = ({id, saveState, deleteSave, ...props}: SaveDetailsProps)=> {
	const [phaseTitle, phaseDay] = saveState ? savePhaseTexts(saveState) : ["", ""]

	return (
		<PageSection className="info" {...props}>
			{(saveState?.graphics || saveState?.context.graphics) &&
				<GraphicsGroup images={saveState?.graphics ?? saveState?.context.graphics ?? {bg:"#000"}} />
			}
			
			{id != undefined && saveState != undefined &&
				<div className="deta">
					{phaseTitle && <div>{phaseTitle}</div>}
					{phaseDay && <div>{phaseDay}</div>}

					<div className="actions">
						<Tooltip id="tooltip" className="tooltip" delayShow={800} />
						<button onClick={deleteSave.bind(null, id)}
							data-tooltip-id="tooltip" data-tooltip-content="Delete" data-tooltip-place="top" data-tooltip-position-strategy="fixed">
							<MdDeleteOutline />
						</button>
						<button onClick={() => exportSave([id])}
							data-tooltip-id="tooltip" data-tooltip-content="Download" data-tooltip-place="top" data-tooltip-position-strategy="fixed">
							<MdOutlineFileDownload />
						</button>
					</div>
				</div>
			}
		</PageSection>
	)
}

export default SaveDetails