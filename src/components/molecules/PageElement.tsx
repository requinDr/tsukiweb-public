import { memo, Fragment, ReactNode, useCallback, useMemo } from "react"
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


const TextContent = ({ text }: { text: string }) => {
	const lines = useMemo(() => {
		if (!text) return []
		// remove empty first and last lines
		return text.replace(/^\n+|\n+$/g, '').split('\n')
	}, [text])

	return lines.map((line, i) =>
		<Fragment key={i}>
			{i > 0 && <br/>}
			<Bbcode text={line}/>
		</Fragment>
	)
}

const ChoiceContent = ({ content }: { content: PageEntry<"choice"> }) => {
	const { choices, selected } = content
	return choices.map(({ str, index }) =>
		<div key={index} className={classNames('choice', { selected: index == selected })}>
			{str}
		</div>
	)
}

const SkipContent = ({ history, content }: { history: History, content: PageEntry<"skip"> }) => {
	const {label} = content as PageEntry<"skip">
	const flags = history.getSceneContext(label)?.flags as string[]
	const sceneTitle = getSceneTitle(flags, label as TsukihimeSceneName)??""
	return (
		<span className='skip'>
			{bb(strings.history.skipped.replace('%0', sceneTitle))}
		</span>
	)
}

const PhaseContent = ({ content }: { content: PageEntry<"phase"> }) => {
	const { phase: { route, routeDay, day } } = content
	const [phaseTitle, phaseDay] = phaseTexts(route, routeDay, day)
	return (
		<span className='phase'>
			{phaseTitle && bb(phaseTitle)}
			{phaseDay && <><br/>{bb(phaseDay)}</>}
		</span>
	)
}

type Props = {
	history: History,
	content: PageEntry,
	onLoad: (page: PageEntry)=>void
	navY?: number
} & Omit<DivProps, 'onLoad'|'content'>

const PageElement = ({history, content, onLoad, navY=0, ...props}: Props)=> {	
	let displayContent: ReactNode

	switch(content.type) {
		case "text" :
			displayContent = <TextContent text={content.text}/>
			break
		case "choice":
			displayContent = <ChoiceContent content={content as PageEntry<"choice">}/>
			break
		case "skip" :
			displayContent = <SkipContent history={history} content={content as PageEntry<"skip">}/>
			break
		case "phase" :
			displayContent = <PhaseContent content={content as PageEntry<"phase">}/>
			break
		default :
			console.error(`Unknown page type ${content.type}`)
	}

	const onFocus = useCallback((e: FocusEvent)=> {
		(e.target! as HTMLElement).parentElement!.scrollIntoView({behavior: 'smooth', block: 'nearest'})
	}, [])

	return (
		<div {...props}>
			<hr page-type={content.type} />
			{content &&
				<Button onClick={onLoad.bind(null,content)} className='load'
					nav-noscroll={1} nav-x={0} nav-y={navY}
					onFocus={onFocus as any}>
					<MdReplay /> {strings.history.load}
				</Button>
			}
			{displayContent}
		</div>
	)
}

export default memo(PageElement)