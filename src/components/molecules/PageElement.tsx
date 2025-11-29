import { memo, Fragment, ReactNode, useCallback, createRef, useEffect } from "react"
import { strings } from "../../translation/lang"
import { phaseTexts } from "../../translation/assets"
import { getSceneTitle } from "../../script/utils"
import { Button } from "@tsukiweb-common/ui-core"
import { MdReplay } from "react-icons/md"
import classNames from "classnames"
import { Bbcode, bb } from "@tsukiweb-common/utils/Bbcode"
import { History, PageEntry } from "utils/history"
import { TsukihimeSceneName } from "types"
import { DivProps } from "@tsukiweb-common/types"
import useButtonSounds from "@tsukiweb-common/hooks/useButtonSounds"

type Props = {
	history: History,
	content: PageEntry,
	onLoad: (page: PageEntry)=>void
	navY?: number
} & Omit<DivProps, 'onLoad'|'content'>

const PageElement = ({history, content, onLoad, navY=0, ...props}: Props)=> {
	
	if (!content) return null
	
	let displayContent: ReactNode
	let divRef = createRef<HTMLDivElement>()

	switch(content.type) {
		case "text" :
			const text = content.text?.split('\n') ?? []
			// remove empty first and last lines
			while (text.length > 0 && text[0].length == 0)
				text.shift()
			while (text.length > 0 && text[text.length-1].length == 0)
				text.pop()

			displayContent = text.map((line, i) =>
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
			const [phaseTitle, phaseDay] = phaseTexts(route, routeDay, day)
			displayContent = <span className='phase'>
				{phaseTitle && bb(phaseTitle)}
				{phaseDay && <><br/>{bb(phaseDay)}</>}
			</span>
			break
		default :
			throw Error(`Unknown page type ${content.type}`)
	}
	const onFocus = useCallback((evt: FocusEvent)=> {
		(evt.target! as HTMLElement).parentElement!.scrollIntoView({behavior: 'smooth', block: 'nearest'})
	}, [])

	return (
	<div {...props}>
		<hr {...{"page-type": content.type}} />
		{content &&
			<Button onClick={onLoad.bind(null,content)} className='load'
					{...{"nav-y": navY, "nav-x": 0}} onFocus={onFocus as any}>
				<MdReplay /> {strings.history.load}
			</Button>
		}
		{displayContent}
	</div>
	)
}

export default memo(PageElement)