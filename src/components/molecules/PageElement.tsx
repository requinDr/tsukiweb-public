import { memo, Fragment, ReactNode } from "react"
import { strings } from "../../translation/lang"
import { phaseTexts } from "../../translation/assets"
import { getSceneTitle } from "../../script/utils"
import { Button } from "@tsukiweb-common/ui-core"
import { MdReplay } from "react-icons/md"
import classNames from "classnames"
import { Bbcode, bb } from "@tsukiweb-common/utils/Bbcode"
import { History, PageEntry } from "utils/history"
import { TsukihimeSceneName } from "types"

type Props = {
	history: History,
	content: PageEntry,
	onLoad: (page: PageEntry)=>void
}

const PageElement = ({history, content, onLoad}: Props)=> {
	
	if (!content)
		return <></>
	
	let displayContent: ReactNode
	switch(content.type) {
		case "text" :
			const text = content.text ?? ""
			displayContent = text.split('\n').map((line, i) =>
				<Fragment key={i}>
					{i > 0 && <br/>}
					<Bbcode text={line}/>
				</Fragment>
			)
			break
		case "choice":
			const {choices, selected} = content as PageEntry<"choice">
			displayContent = choices.map(({str, index})=>
				<div key={index} className={classNames('choice', {selected: index==selected})}>
					{str}
				</div>
			)
			break
		case "skip" :
			const {label} = content as PageEntry<"skip">
			const flags = history.getSceneContext(label)?.flags as string[]
			const sceneTitle = getSceneTitle(flags, label as TsukihimeSceneName)??""
			displayContent = <span className='skip'>
				{bb(strings.history.skipped.replace('%0', sceneTitle))}
			</span>
			break
		case "phase" :
			const {phase: {route, routeDay, day}} = content as PageEntry<"phase">
			const [phaseTitle, phaseDay] = phaseTexts(route ?? "", routeDay ?? "", day ?? 0)
			displayContent = <span className='phase'>
				{phaseTitle && bb(phaseTitle)}
				{phaseDay && <><br/>{bb(phaseDay)}</>}
			</span>
			break
		default :
			throw Error(`Unknown page type ${content.type}`)
	}
	return (
	<>
		<hr {...{"page-type": content.type}} />
		{content &&
			<Button onClick={onLoad.bind(null,content)} className='load'>
				<MdReplay /> {strings.history.load}
			</Button>
		}
		{displayContent}
	</>
	)
}

export default memo(PageElement)