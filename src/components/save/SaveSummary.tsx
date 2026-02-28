import { Fragment, memo } from "react"
import { savePhaseTexts, SaveState } from "../../utils/savestates"
import { getSceneTitle } from "../../script/utils"
import { bb, noBb } from "@tsukiweb-common/utils/Bbcode"
import { PageEntry } from "script/history"
import { TsukihimeSceneName } from "types"

const SaveSummary = memo(({saveState}: {saveState: SaveState})=> {
	const lastPage = saveState.pages[saveState.pages.length-1]

	switch (lastPage?.type ?? "text") {
		case "text" :
			return <>{noBb(lastPage.text ?? "").trim()}</>

		case "choice" :
			const {choices} = lastPage as PageEntry<"choice">
			return (
				<>{choices.map(({index: i, str}) =>
					<Fragment key={i}>
						{i > 0 && <>/ </>}
						<span className="choice" key={i}>
							{bb(str)}
						</span>
					</Fragment>
				)}</>
			)

		case "skip" :
			const flags = saveState.scenes.at(-1)?.flags ?? []
			return (
				<span className="scene-skip">
					{noBb(getSceneTitle(flags, (lastPage as PageEntry<"skip">).label as TsukihimeSceneName) ?? "")}
				</span>
			)

		case "phase" :
			const [title, day] = savePhaseTexts(saveState)
			return (
				<>
					{title}
					{day && <>, {day}</>}
				</>
			)
		
		default :
			throw Error(`unimplemented page type ${lastPage?.type}`)
	}
})

export default SaveSummary