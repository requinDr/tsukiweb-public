import { Tooltip } from "react-tooltip"
import { SaveState, exportSave } from "../../utils/savestates"
import { savePhaseTexts } from "../SavesLayout"
import { MdDeleteOutline, MdOutlineFileDownload } from "react-icons/md"
import { BiSolidHeart } from "react-icons/bi"
import GraphicsGroup from "../molecules/GraphicsGroup"
import { strings } from "translation/lang"
import classNames from "classnames"

type SaveDetailsProps = {
	id?: number
	saveState?: SaveState
	deleteSave: (id: number)=>void
}
const SaveDetails = ({id, saveState, deleteSave}: SaveDetailsProps)=> {
	const [phaseTitle, phaseDay] = saveState ? savePhaseTexts(saveState) : ["", ""]

	return (
		<section className={classNames("info", { "preview-save": saveState !== undefined })}>		
			{id != undefined && saveState != undefined && <>
				<div className="graphics-wrapper">
					{(saveState?.graphics || saveState?.context.graphics) &&
						<GraphicsGroup images={saveState?.graphics ?? saveState?.context.graphics ?? {bg:"#000"}} />
					}
				</div>
				{(phaseTitle || phaseDay) && 
					<div className="deta">
						{phaseTitle && <div>{phaseTitle}</div>}
						{phaseDay && <div>{phaseDay}</div>}
					</div>
				}

				<div className="affection">
					<AffectionTable regard={saveState.progress.regard} />
				</div>

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
			</>}
		</section>
	)
}

export default SaveDetails


const AffectionTable = ({ regard }: { regard: SaveState["progress"]["regard"] }) => {
	return (
		<table className="affection-table">
			<tbody>
				{regard?.ark && regard?.ark > 0 &&
					<AffectionRow name={strings.characters.ark} value={regard.ark} maxHearts={20} />}
				{regard?.ciel && regard?.ciel > 0 &&
					<AffectionRow name={strings.characters.cel} value={regard.ciel} maxHearts={20} />}
				{regard?.akiha && regard?.akiha > 0 &&
					<AffectionRow name={strings.characters.aki} value={regard.akiha} maxHearts={20} />}
				{regard?.hisui && regard?.hisui > 0 &&
					<AffectionRow name={strings.characters.his} value={regard.hisui} maxHearts={20} />}
				{regard?.kohaku && regard?.kohaku > 0 &&
					<AffectionRow name={strings.characters.koha} value={regard.kohaku} maxHearts={20} />}
			</tbody>
		</table>
	)
}

const AffectionRow = ({ name, value, maxHearts }: { name: string, value: number, maxHearts?: number }) => {
	return (
		<tr>
			<td className="name">{name}</td>
			<td className="hearts">
				{Array(Math.min(value, maxHearts ? maxHearts : value)).fill(null).map((_, index) => (
					<BiSolidHeart key={`${name}-heart-${index}`} className="heart-icon" />
				))}
			</td>
		</tr>
	)
}