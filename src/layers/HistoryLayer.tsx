import { memo, useCallback, useEffect, useLayoutEffect, useRef  } from 'react';
import { InGameLayersHandler } from '../utils/display';
import { History, PageEntry } from '../utils/history';
import { strings } from '../translation/lang';
import PageElement from '../components/molecules/PageElement';
import classNames from 'classnames';
import { Button, FixedFooter } from '@tsukiweb-common/ui-core';
import Flowchart from 'components/flowchart/Flowchart';


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
				>
					{strings.close}
				</Button>
				{show?.flowchart &&
				<Button
					variant="menu"
					onClick={toggleView}
					style={{ marginLeft: '1em' }}
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

	useEffect(() => {
		// scroll near the bottom of the history
		const historyElmt = historyRef.current
		if (historyElmt)
			historyElmt.scrollTop = historyElmt.scrollHeight - historyElmt.clientHeight - 1
	}, [historyRef])

	const onScroll = useCallback(()=> {
		//when scrolled to the bottom of history, hide history
		const elmt = historyRef.current!
		const bottom = elmt.scrollHeight - Math.round(elmt.scrollTop) === elmt.clientHeight
		if (bottom)
			close()
	}, [])

	function onClick(index: number, _page: PageEntry) {
		onPageSelect(index)
	}
	//if (!history.empty) // at least one element in the iterator TODO display a 'nothing here' icon

	return (
		<div id="history" ref={historyRef} onScroll={onScroll}>
			<div className="text-container">
				{Array.from(history.allPages, (page, i) =>
					<PageElement history={history} key={i} content={page} onLoad={onClick.bind(null, i)} />
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

	return (
		<div id="scenes">
			<div className="flowchart-container">
				<Flowchart
					history={history}
					onSceneClick={(id=> onSceneSelect(history.sceneIndex(id)))}/>
			</div>
		</div>
	)
}