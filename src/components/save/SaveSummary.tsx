import { Fragment, memo } from "react"
import { PageContent } from "../../types"
import { SaveState } from "../../utils/savestates"
import { getSceneTitle } from "../../utils/scriptUtils"
import { savePhaseTexts } from "../SavesLayout"
import classNames from "classnames"
import { noBb } from "@tsukiweb-common/utils/Bbcode"

const SaveSummary = memo(({saveState}: {saveState: SaveState})=> {
	const page = saveState.page

	switch (page?.contentType) {
		case "text" :
			return <>{noBb((page as PageContent<"text">).text).trim()}</>

		case "choice" :
			const {choices, selected: sel} = page as PageContent<"choice">
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
			return (
				<span className="scene-skip">
					{noBb(getSceneTitle((page as PageContent<"skip">).scene) ?? "")}
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