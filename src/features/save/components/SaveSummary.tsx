import { Fragment, memo } from "react"
import { noBb } from "@tsukiweb/common/utils/Bbcode"
import { PageEntry } from "engine/history"
import { SceneName } from "app/utils/types"
import { SaveState, savePhaseTexts } from "engine/savestates";
import { getSceneTitle } from "engine/utils";
import { useStrings } from "translation/lang";

type Props = {
	saveState: SaveState
}
const SaveSummary = ({saveState}: Props) => {
	useStrings()
	const lastPage = saveState.pages.at(-1)
	if (!lastPage) return null

	switch (lastPage.type ?? "text") {
		case "text":
			return noBb(lastPage.text ?? "").trim()

		case "choice":
			const {choices} = lastPage as PageEntry<"choice">
			return choices.map(({index: i, str}) =>
				<Fragment key={i}>
					{i > 0 && <>/ </>}
					{noBb(str)}
				</Fragment>
			)

		case "skip":
			const flags = saveState.scenes.at(-1)?.flags ?? []
			return noBb(getSceneTitle(flags, (lastPage as PageEntry<"skip">).label as SceneName) ?? "")

		case "phase":
			const [title, day] = savePhaseTexts(saveState)
			return <>{title} {day && <>, {day}</>}</>
		
		default:
			throw Error(`unimplemented page type ${lastPage.type}`)
	}
}

export default memo(SaveSummary)