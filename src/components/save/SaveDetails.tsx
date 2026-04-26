import { SaveState, savePhaseTexts, savesManager } from "../../utils/savestates"
import { MdDeleteOutline, MdOutlineFileDownload } from "react-icons/md"
import { BiSolidHeart } from "react-icons/bi"
import { GraphicsGroup } from "@tsukiweb-common/graphics"
import { strings } from "translation/lang"
import classNames from "classnames"
import { Regard } from "script/ScriptPlayer"
import { jsonMerge } from "@tsukiweb-common/utils/utils"
import { isPDScene } from "script/utils"
import { PlusDiscSceneName } from "types"
import { Button } from "@tsukiweb-common/ui-core"
import { BADGES_DEFINES } from "components/flowchart/badges";

type SaveDetailsProps = {
	id?: number
	saveState?: SaveState
	deleteSave: (id: number)=>void
}
const SaveDetails = ({id, saveState, deleteSave}: SaveDetailsProps)=> {
	const [phaseTitle, phaseDay] = saveState ? savePhaseTexts(saveState) : ["", ""]
	const lastPage = saveState?.pages.at(-1)
	const progress = saveState?.scenes.reduce((s1, s2)=>jsonMerge(s2, s1))
	const graphics = jsonMerge(saveState?.graphics ?? {},
			lastPage?.graphics ?? {bg: "#000"})
	const regard = progress?.regard ?? {}
	const flags = progress?.flags ?? []

	const isPd = lastPage?.label && isPDScene(lastPage.label)

	return (
		<section className={classNames("info", { "preview-save": saveState !== undefined })}>		
			{id != undefined && saveState != undefined && <>
				<div className="graphics-wrapper">
					{(graphics) &&
						<GraphicsGroup images={graphics} />
					}

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
				</div>
				<div className="save-details-content">
					{regard &&
						<div className="affection">
							<AffectionTable regard={regard} />
						</div>
					}
					{flags && flags.length > 0 &&
						<div className="flags">
							<FlagsList flags={flags} />
						</div>
					}

					<div className="actions">
						<Button onClick={deleteSave.bind(null, id)}
							nav-auto={1}
							aria-label={strings.saves.delete}
						>
							<MdDeleteOutline />
						</Button>
						<Button onClick={() => savesManager.exportSave(id)}
							nav-auto={1}
							aria-label={strings.saves.export}
						>
							<MdOutlineFileDownload />
						</Button>
					</div>
				</div>
			</>}
		</section>
	)
}

export default SaveDetails


const AffectionTable = ({ regard }: { regard?: Partial<Regard> }) => {
	return (
		<div className="affection-table">
			<svg width="20" height="20" className="defs">{BADGES_DEFINES}</svg>
			{Object.entries(regard ?? {})
				.filter(([_, pts])=> pts > 0)
				.map(([char, pts]) =>
					<AffectionRow key={char}
						char={char}
						name={strings.characters[char as keyof Regard]}
						value={pts} maxHearts={20}/>
				)
			}
		</div>
	)
}

type AffectionRowProps = {
	char: string
	name: string
	value: number
	maxHearts?: number
}
const AffectionRow = ({ char, name, value, maxHearts }: AffectionRowProps) => {
	return (
		<div className="row">
			<img src={`./chars/${char}.webp`} alt={name} className="char" />
			<div className="hearts">
				{Array(Math.min(value, maxHearts ? maxHearts : value))
					.fill(null).map((_, index) =>
					<BiSolidHeart key={`${char}-heart-${index}`}
						className="heart-icon"
						style={{ fill: `url(#${char}_grad)` }}
					/>
				)}
			</div>
		</div>
	)
}

const FlagsList = ({ flags }: { flags: string[] }) => {
	return (
		<div className="flags-list">
			{flags.map(flag =>
				<svg key={flag} className="badge" viewBox="-4 -4 8 8" preserveAspectRatio="xMinYMid meet">
					<g className="badge">
						<use href="#flag-icon"/>
						<text y="1.6" stroke="none" fill="white" textAnchor="middle">
							{flag}
						</text>
					</g>
				</svg>
			)}
		</div>
	)
}