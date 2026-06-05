import { SaveState, savePhaseTexts, savesManager } from "../../../engine/savestates"
import { MdDeleteOutline, MdOutlineFileDownload } from "react-icons/md"
import { GraphicsGroup } from "@tsukiweb-common/graphics"
import { strings } from "translation/lang"
import classNames from "classnames"
import { jsonMerge } from "@tsukiweb-common/utils/utils"
import { isPDScene } from "engine/utils"
import { PlusDiscSceneName } from "app/utils/types"
import { Button } from "@tsukiweb-common/ui-core"
import { ProgressPanel } from "features/game/components/shared/ProgressPanel";

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
					<ProgressPanel regard={regard} flags={flags}/>

					<div className="actions">
						<Button onClick={deleteSave.bind(null, id)}
							nav-auto={1}
							aria-label={strings.saves.delete}
						>
							<MdDeleteOutline aria-hidden />
						</Button>
						<Button onClick={() => savesManager.exportSave(id)}
							nav-auto={1}
							aria-label={strings.saves.export}
						>
							<MdOutlineFileDownload aria-hidden />
						</Button>
					</div>
				</div>
			</>}
		</section>
	)
}

export default SaveDetails
