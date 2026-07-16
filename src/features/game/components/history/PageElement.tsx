import { memo, Fragment, ReactNode, useCallback, useMemo } from "react"
import { Button } from "@tsukiweb-common/ui-core"
import { MdHistory } from "react-icons/md"
import classNames from "classnames"
import { Bbcode, bb } from "@tsukiweb-common/utils/Bbcode"
import { History, PageEntry } from "engine/history"
import { SceneName } from "app/utils/types"
import { DivProps } from "@tsukiweb-common/types"
import { audio } from "engine/audio"
import { getSceneTitle } from "engine/utils";
import { phaseTexts } from "translation/assets";
import { useStrings } from "translation/lang";


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
	const strings = useStrings()
	const {label} = content as PageEntry<"skip">
	const flags = history.sceneContext(label)?.flags as string[]
	const sceneTitle = getSceneTitle(flags, label as SceneName)??""
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
	const strings = useStrings()
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
		<>
			<hr page-type={content.type} />
			<div {...props} className="history-page">
				{content &&
					<Button
						audio={audio} hoverSound='tick' clickSound='glass'
						onClick={onLoad.bind(null,content)} className='load'
						nav-scroll='none' nav-x={0} nav-y={navY}
						onFocus={onFocus as any}>
						<MdHistory aria-hidden /> {strings.history.load}
					</Button>
				}
				{displayContent}
			</div>
		</>
	)
}

export default memo(PageElement)