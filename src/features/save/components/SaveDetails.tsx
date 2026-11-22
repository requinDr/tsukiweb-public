import { SaveState, savesManager } from "../../../engine/savestates"
import { MdDeleteOutline, MdOutlineFileDownload } from "react-icons/md"
import { GraphicsGroup } from "@tsukiweb/common/graphics"
import { useStrings } from "translation/lang"
import classNames from "classnames"
import { jsonMerge } from "@tsukiweb/common/utils/utils"
import { CharId } from "app/utils/types"
import { Button } from "@tsukiweb/common/ui-core"
import { ProgressPanel } from "features/game/components/shared/ProgressPanel";
import { settings } from "engine/settings";
import { PartialRecord } from "@tsukiweb/common/types";
import { useEventActions } from "@tsukiweb/common/input/eventActions";
import { savesKeyMap } from "features/game/utils/keybind";

type SaveDetailsProps = {
	id?: number
	saveState?: SaveState
	deleteSave: (id: number)=>void
}
const SaveDetails = ({id, saveState, deleteSave}: SaveDetailsProps)=> {
	const strings = useStrings()
	const lastPage = saveState?.pages.at(-1)
	const progress = saveState?.scenes.reduce((s1, s2)=>jsonMerge(s2, s1))
	const graphics = jsonMerge(saveState?.graphics ?? {},
			lastPage?.graphics ?? {bg: "#000"})
	let regard: PartialRecord<CharId, number>
	let flags: Array<string>
	if (settings.flowchartBadges) {
		regard = progress?.points ?? {}
		flags = progress?.flags ?? []
	} else {
		regard = {}
		flags = []
	}

	useEventActions(savesKeyMap, (action: string)=> {
		if (action == "delete" && id != undefined) {
			deleteSave(id)
			return true
		}
		return false
	}, document, {capture: true}, id != undefined,
	[id])

	return (
		<section className={classNames("info", { "preview-save": saveState !== undefined })}>		
			{id != undefined && saveState != undefined && <>
				<div className="graphics-wrapper">
					<GraphicsGroup images={graphics} />
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
