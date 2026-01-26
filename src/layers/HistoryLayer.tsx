import { memo, useCallback, useLayoutEffect, useRef } from 'react';
import { InGameLayersHandler } from '../utils/display';
import { History } from '../script/history';
import { strings } from '../translation/lang';
import PageElement from '../components/history/PageElement';
import classNames from 'classnames';
import { Button, FixedFooter } from '@tsukiweb-common/ui-core';
import Flowchart from 'components/flowchart/Flowchart';
import { LabelName, TsukihimeSceneName } from 'types';


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

	const handleClose = useCallback(()=> {
		(document.activeElement as HTMLElement|null)?.blur()
		layers.back()
	}, [layers])

	const setLayer = useCallback((layer: 'history' | 'flowchart')=> {
		layers[layer] = true
	}, [layers])

	const loadPage = useCallback((index: number)=> {
		history.onPageLoad(index)
		handleClose()
		onRewind()
	}, [handleClose, onRewind])

	const loadScene = useCallback((label: LabelName)=> {
		history.onSceneLoad(label)
		handleClose()
		onRewind()
	}, [handleClose, onRewind])
	
	return (
		<div
			id="layer-history"
			{...divProps}
			className={classNames("layer", {"show": display}, divProps?.className)}
			aria-hidden={!display}
			ref={rootRef}>
			{layers.history && history.pagesLength > 0 ?
				<HistoryTab key={history.lastPage.page}
					history={history}
					close={handleClose}
					onPageSelect={loadPage}
				/>
			: layers.flowchart ?
				<FlowchartTab key={history.lastScene.label}
					history={history}
					onSceneSelect={loadScene}
				/>
			: null
			}

			<FixedFooter style={{ background: "var(--transparent-layer)" }}>
				{(layers.history || layers.flowchart) && <>
					<Button
						variant="default"
						onClick={handleClose}
						nav-x={-2} nav-y={10000} // 10k prevents overlapping with flowchart nodes
					>
						{`<<`} {strings.back}
					</Button>
					{show?.flowchart && <>
						<Button
							variant="select"
							onClick={() => setLayer('history')}
							active={layers.history}
							style={{ marginLeft: '1em', flex: 1 }}
							nav-x={-1} nav-y={10000}
						>
							{strings.menu.history}
						</Button>
						<Button
							variant="select"
							onClick={() => setLayer('flowchart')}
							active={layers.flowchart}
							style={{ marginLeft: '.5em', flex: 1 }}
							nav-x={0} nav-y={10000}
						>
							{strings.extra.scenes}
						</Button>
					</>}
				</>}
			</FixedFooter>
		</div>
	)
}

export default memo(HistoryLayer)


type HistoryTabProps = {
	history: History
	close: () => void
	onPageSelect: (pageIndex: number) => void
}
const HistoryTab = ({
		history,
		close,
		onPageSelect
	}: HistoryTabProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const pagesArray = Array.from(history.allPages)

	useLayoutEffect(() => {
		if (containerRef.current) {
			const { scrollHeight, clientHeight } = containerRef.current
			containerRef.current.scrollTo({ 
				top: scrollHeight - clientHeight - 2, //-2 for precision issues
				behavior: 'instant' 
			})
		}
	}, [history.pagesLength])

	const onScroll = useCallback(()=> {
		const elmt = containerRef.current
		if (!elmt) return
		const diff = elmt.scrollHeight - elmt.scrollTop - elmt.clientHeight

		if (diff <= 1) close()
	}, [close])

	const handlePageClick = (index: number) => {
		onPageSelect(index)
	}

	return (
		<div id="history" className="scroll-container" ref={containerRef} onScroll={onScroll}>
			<div className="text-container" style={{ minHeight: "calc(100% + 2px)"}}>
				{pagesArray.map((page, i) =>
					<PageElement key={i} history={history} content={page}
						onLoad={() => handlePageClick(i)}
						navY={i - history.pagesLength}
					/>
				)}
			</div>
		</div>
	)
}

type FlowchartTabProps = {
	history: History
	onSceneSelect: (label: LabelName)=>void
}
const FlowchartTab = ({ history, onSceneSelect }: FlowchartTabProps) => {
	useLayoutEffect(()=> {
		const activeNode = document.querySelector(`.fc-scene.active`)
		if (activeNode) {
			activeNode.scrollIntoView({ behavior: "instant", block: "center" })
		}
	}, [history])

	const handleSceneSelect = useCallback((id: TsukihimeSceneName)=> {
		onSceneSelect(id)
	}, [onSceneSelect])

	return (
		<div id="flowchart-progress" className="scroll-container">
			<div className="flowchart-container">
				<Flowchart
					history={history}
					onSceneClick={handleSceneSelect}
					mode="playthrough"
				/>
			</div>
		</div>
	)
}