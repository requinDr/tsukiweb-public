import { Fragment, memo } from "react"
import { SaveState } from "../../utils/savestates"
import { getSceneTitle } from "../../script/utils"
import { savePhaseTexts } from "../SavesLayout"
import classNames from "classnames"
import { noBb } from "@tsukiweb-common/utils/Bbcode"
import { PageEntry } from "utils/history"
import { LabelName, TsukihimeSceneName } from "types"

const SaveSummary = memo(({saveState}: {saveState: SaveState})=> {
	const lastPage = saveState.pages[saveState.pages.length-1]

	switch (lastPage?.type) {
		case "text" :
			return <>{noBb(lastPage.text ?? "").trim()}</>

		case "choice" :
			const {choices, selected: sel} = lastPage as PageEntry<"choice">
			return (
				<>{choices.map(({index: i, str}) =>
					<Fragment key={i}>
						{i > 0 && <>, </>}
						<span className={classNames("choice", {selected: sel == i})} key={i}>
							{noBb(str)}
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
			throw Error(`unimplemented page type`)
	}
})

export default SaveSummary