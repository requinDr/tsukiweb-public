import { memo, Fragment } from "react"
import { PageContent } from "../../types"
import { strings } from "../../translation/lang"
import { phaseTexts } from "../../translation/assets"
import { SaveState } from "../../utils/savestates"
import { getSceneTitle } from "../../utils/scriptUtils"
import Button from "@tsukiweb-common/ui-core/components/Button"
import { MdReplay } from "react-icons/md"
import classNames from "classnames"
import { Bbcode, bb } from "@tsukiweb-common/utils/Bbcode"

const PageElement = ({saveState, onLoad}: {saveState: SaveState, onLoad: (ss: SaveState)=>void})=> {
	if (saveState.page == undefined)
		return <></>
	
	const {contentType, ...content} = saveState.page
	let displayContent
	switch(contentType) {
		case "text" :
			const {text} = content as PageContent<"text">
			displayContent = text.split('\n').map((line, i) =>
				<Fragment key={i}>
					{i > 0 && <br/>}
					<Bbcode text={line}/>
				</Fragment>
			)
			break
		case "choice":
			const {choices, selected} = content as PageContent<"choice">  
			displayContent = <>{choices.map(({str, index})=>
				<div key={index} className={classNames('choice', {selected: index==selected})}>
					{str}
				</div>
			)}</>
			break
		case "skip" :
			const {scene} = content as PageContent<"skip">
			const sceneTitle = getSceneTitle(scene)??""
			displayContent = <span className='skip'>
				{bb(strings.history.skipped.replace('$0', sceneTitle))}
			</span>
			break
		case "phase" :
			const {route, routeDay, day} = saveState.context.phase ?? {}
			const [phaseTitle, phaseDay] = phaseTexts(route ?? "", routeDay ?? "", day ?? 0)
			displayContent = <span className='phase'>
				{phaseTitle && bb(phaseTitle)}
				{phaseDay && <><br/>{bb(phaseDay)}</>}
			</span>
			break
		default :
			throw Error(`Unknown page type ${contentType}`)
	}
	return (
	<>
		<hr {...{"page-type": contentType}} />
		{saveState &&
			<Button onClick={onLoad.bind(null,saveState)} className='load'>
				<MdReplay />	{strings.history.load}
			</Button>
		}
		{displayContent}
	</>
	)
}

export default memo(PageElement)