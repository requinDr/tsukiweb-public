import { Tooltip } from "react-tooltip"
import { SaveState, savesManager } from "../../utils/savestates"
import { savePhaseTexts } from "./SavesLayout"
import { MdDeleteOutline, MdOutlineFileDownload } from "react-icons/md"
import { BiSolidHeart } from "react-icons/bi"
import GraphicsGroup from "../molecules/GraphicsGroup"
import { strings } from "translation/lang"
import classNames from "classnames"
import { Regard } from "script/ScriptPlayer"
import { jsonMerge } from "@tsukiweb-common/utils/utils"
import { isPDScene } from "script/utils"
import { PlusDiscSceneName } from "types"

type SaveDetailsProps = {
	id?: number
	saveState?: SaveState
	deleteSave: (id: number)=>void
}
const SaveDetails = ({id, saveState, deleteSave}: SaveDetailsProps)=> {
	const [phaseTitle, phaseDay] = saveState ? savePhaseTexts(saveState) : ["", ""]
	const lastPage = saveState?.pages.at(-1)
	const progress = saveState?.scenes.reduce((s1, s2)=>jsonMerge(s1, s2))
	const graphics = jsonMerge(saveState?.graphics ?? {},
			lastPage?.graphics ?? {bg: "#000"})
	const regard = progress?.regard ?? {}

	const isPd = lastPage?.label && isPDScene(lastPage.label)

	return (
		<section className={classNames("info", { "preview-save": saveState !== undefined })}>		
			{id != undefined && saveState != undefined && <>
				<div className="graphics-wrapper">
					{(graphics) &&
						<GraphicsGroup images={graphics} />
					}
				</div>
				<div className="save-details-content">
					{isPd ?
						<div className="deta">
							{strings.plus_disc_scenario[lastPage.label as PlusDiscSceneName]}
						</div>
					: (phaseTitle || phaseDay) &&
						<div className="deta">
							{phaseTitle && <div>{phaseTitle}</div>}
							{phaseDay && <div>{phaseDay}</div>}
						</div>
					}

					<div className="affection">
						<AffectionTable regard={regard} />
					</div>

					<div className="actions">
						<Tooltip id="tooltip" className="tooltip" delayShow={800} />
						<button onClick={deleteSave.bind(null, id)}
							data-tooltip-id="tooltip" data-tooltip-content="Delete" data-tooltip-place="top" data-tooltip-position-strategy="fixed">
							<MdDeleteOutline />
						</button>
						<button onClick={() => savesManager.exportSave(id)}
							data-tooltip-id="tooltip" data-tooltip-content="Download" data-tooltip-place="top" data-tooltip-position-strategy="fixed">
							<MdOutlineFileDownload />
						</button>
					</div>
				</div>
			</>}
		</section>
	)
}

export default SaveDetails


const AffectionTable = ({ regard }: { regard?: Partial<Regard> }) => {
	return (
		<table className="affection-table">
			<tbody>
				{Object.entries(regard ?? {}).map(([char, pts])=> {
					return pts > 0 ?
						<AffectionRow key={char}
							name={strings.characters[char as keyof Regard]}
							value={pts} maxHearts={20}/>
					: undefined
				})}
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