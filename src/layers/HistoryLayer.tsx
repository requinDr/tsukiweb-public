import { createRef, memo, useCallback, useEffect, useLayoutEffect, useRef  } from 'react';
import { InGameLayersHandler } from '../utils/display';
import { History, PageEntry } from '../utils/history';
import { strings } from '../translation/lang';
import PageElement from '../components/molecules/PageElement';
import classNames from 'classnames';
import { Button, FixedFooter } from '@tsukiweb-common/ui-core';
import Flowchart from 'components/flowchart/Flowchart';
import { TsukihimeSceneName } from 'types';


type Props = {
	display: boolean
	history: History
	onRewind: VoidFunction
	layers: InGameLayersHandler
	show?: Partial<{
		flowchart: boolean
	}>
	divProps?: React.HTMLProps<HTMLDivElement>
}
const HistoryLayer = ({ display, history, onRewind, layers, show, divProps }: Props) => {
	const rootRef = useRef<HTMLDivElement>(null)

	const close = useCallback(()=> {
		(document.activeElement as HTMLElement|null)?.blur()
		layers.back()
	}, [])

	const toggleView = useCallback(()=> {
		if (layers.history)
			layers.flowchart = true
		else
			layers.history = true
	}, [])

	const loadPage = useCallback((index: number)=> {
		history.onPageLoad(index)
		close()
		onRewind()
	}, [])

	const loadScene = useCallback((index: number)=> {
		history.onSceneLoad(index)
		close()
		onRewind()
	}, [])
	
	return (
		<div
			id="layer-history"
			{...divProps}
			className={classNames("layer", {"show": display}, divProps?.className)}
			ref={rootRef}>
			<div className='scroll-container'>
				{layers.history && history.pagesLength > 0 ?
					<HistoryDisplay key={history.lastPage.page}
						history={history}
						close={close}
						onPageSelect={loadPage}/>
				: layers.flowchart ?
					<FlowchartDisplay key={history.lastScene.label}
						history={history}
						onSceneSelect={loadScene}/>
				: null
				}
			</div>

			<FixedFooter>
				<Button
					variant="menu"
					onClick={close}
					{...{"nav-x": -1, "nav-y": 1}}
				>
					{strings.close}
				</Button>
				{show?.flowchart &&
				<Button
					variant="menu"
					onClick={toggleView}
					style={{ marginLeft: '1em' }}
					{...{"nav-x": 0, "nav-y": 1}}
				>
					{layers.history ?
						<>{strings.extra.scenes}</>
					:
						<>{strings.menu.history}</>
					}
				</Button>
				}
			</FixedFooter>
		</div>
	)
}


export default memo(HistoryLayer)


type HistoryDisplayProps = {
	history: History
	close: () => void
	onPageSelect: (pageIndex: number) => void
}
const HistoryDisplay = ({
		history,
		close,
		onPageSelect
	}: HistoryDisplayProps) => {
	const historyRef = useRef<HTMLDivElement>(null)
	const lastPageRef = createRef<HTMLElement>()
	const scrolling = useRef<boolean>(false)

	useEffect(()=> {
		lastPageRef.current?.scrollIntoView({behavior: 'auto', block: 'nearest'})
	}, [lastPageRef])

	const onScroll = useCallback((evt: Event)=> {
		//when scrolled to the bottom of history, hide history
		if (!scrolling.current && evt.isTrusted) {
			const elmt = historyRef.current!
			const diff = elmt.scrollHeight - elmt.scrollTop - elmt.clientHeight

			const bottom = diff <= 1
			if (bottom)
				close()
			else
				scrolling.current = true
		}
	}, [])

	const onScrollEnd = useCallback(()=> {
		scrolling.current = false
	}, [])

	function onClick(index: number, _page: PageEntry) {
		onPageSelect(index)
	}
	//if (!history.empty) // at least one element in the iterator TODO display a 'nothing here' icon

	return (
		<div id="history" ref={historyRef} onScroll={onScroll as any} onScrollEnd={onScrollEnd}>
			<div className="text-container">
				{Array.from(history.allPages, (page, i) =>
					<PageElement history={history} key={i} content={page}
								 onLoad={onClick.bind(null, i)}
								 navY={i + 1 - history.pagesLength}
								 {...(i == history.pagesLength - 1) ? {ref: lastPageRef} : {}}
								 />
				)}
			</div>
		</div>
	)
}

type FlowchartDisplayProps = {
	history: History
	onSceneSelect: (index: number)=>void
}
const FlowchartDisplay = ({ history, onSceneSelect }: FlowchartDisplayProps) => {
	useLayoutEffect(()=> {
		const activeNode = document.querySelector(`.fc-scene.active`)
		if (activeNode) {
			activeNode.scrollIntoView({ behavior: "instant", block: "center" })
		}
	}, [history])

	const handleSceneSelect = useCallback((id: TsukihimeSceneName)=> {
		onSceneSelect(history.sceneIndex(id))
	}, [history, onSceneSelect])

	return (
		<div id="scenes">
			<div className="flowchart-container">
				<Flowchart
					history={history}
					onSceneClick={handleSceneSelect}
				/>
			</div>
		</div>
	)
}