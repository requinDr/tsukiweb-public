import { memo, useCallback, useLayoutEffect, useRef } from 'react';
import classNames from 'classnames';
import { Button, FixedFooter } from '@tsukiweb-common/ui-core';
import Flowchart from 'features/flowchart/components/Flowchart';
import { playScene } from 'engine/savestates';
import { strings } from 'translation/lang';
import PageElement from '../history/PageElement';
import { ProgressPanel } from '../shared/ProgressPanel';
import { History } from 'engine/history';
import { InGameLayersHandler } from 'app/utils/display';
import { LabelName, SceneName } from 'app/utils/types';
import { settings } from 'engine/settings';


type Props = {
	display: boolean
	history: History
	onRewind: VoidFunction
	layers: InGameLayersHandler
	continueScript?: boolean
	show?: Partial<{
		flowchart: boolean
	}>
	divProps?: React.HTMLProps<HTMLDivElement>
}
const HistoryLayer = ({ display, history, onRewind, layers, continueScript = true, show, divProps }: Props) => {
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
		if (!continueScript) {
			playScene(label, { continueScript: false, viewedOnly: false })
		} else {
			history.onSceneLoad(label)
		}
		handleClose()
		onRewind()
	}, [continueScript, handleClose, onRewind])
	
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
					onPageSelect={loadPage}
				/>
			: layers.flowchart ?
				<FlowchartTab key={history.lastScene.label}
					history={history}
					onSceneSelect={loadScene}
					continueScript={continueScript}
				/>
			: null
			}

			<FixedFooter style={{ background: "var(--transparent-layer)" }}>
				{(layers.history || layers.flowchart) && <>
					<Button
						variant="default"
						className="back-button"
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
	onPageSelect: (pageIndex: number) => void
}
const HistoryTab = ({
		history,
		onPageSelect
	}: HistoryTabProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const pagesArray = Array.from(history.allPages)

	useLayoutEffect(() => {
		if (containerRef.current) {
			const { scrollHeight, clientHeight } = containerRef.current
			containerRef.current.scrollTo({ 
				top: scrollHeight - clientHeight,
				behavior: 'instant' 
			})
		}
	}, [history.pagesLength])

	const handlePageClick = (index: number) => {
		onPageSelect(index)
	}

	return (
		<div id="history" className="scroll-container" ref={containerRef}>
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
	continueScript: boolean
	onSceneSelect: (label: LabelName)=>void
}
const FlowchartTab = ({ history, continueScript, onSceneSelect }: FlowchartTabProps) => {
	const isSceneReplay = !continueScript

	useLayoutEffect(()=> {
		const activeNode = document.querySelector(`.fc-scene.active`)
		if (activeNode) {
			activeNode.scrollIntoView({ behavior: "instant", block: "center" })
		}
	}, [history])

	const handleSceneSelect = useCallback((id: SceneName)=> {
		onSceneSelect(id)
	}, [onSceneSelect])

	return (
		<div id="flowchart-progress" className="scroll-container">
			{!isSceneReplay && settings.flowchartBadges && (
				<div className="progress-container">
					<ProgressPanel script={history.script!}/>
				</div>
			)}
			<div className="flowchart-container">
				<Flowchart
					history={isSceneReplay ? undefined : history}
					onSceneClick={handleSceneSelect}
					mode={isSceneReplay ? 'viewer' : 'playthrough'}
				/>
			</div>
		</div>
	)
}