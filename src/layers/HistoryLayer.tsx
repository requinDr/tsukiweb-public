import { useEffect, useRef, useState } from 'react';
import { displayMode, isViewAnyOf } from '../utils/display';
import { SaveState, loadSaveState } from "../utils/savestates";
import history from '../utils/history';
import script from '../utils/script';
import { strings } from '../translation/lang';
import PageElement from '../components/molecules/PageElement';
import FixedFooter from '@tsukiweb-common/ui-core/components/FixedFooter';
import { useObserved, useObserver } from '@tsukiweb-common/utils/Observer';
import { addEventListener } from '@tsukiweb-common/utils/utils';
import classNames from 'classnames';
import Button from '@tsukiweb-common/ui-core/components/Button';
import Flowchart from 'components/flowchart/Flowchart';
import { gameContext } from 'utils/variables';


type Props = {
	divProps?: React.HTMLProps<HTMLDivElement>
}
const HistoryLayer = ({ divProps }: Props) => {
	const [display, setDisplay] = useObserved(displayMode, 'history')
	const [view, setView] = useState<"history" | "flowchart">("history")
	const rootRef = useRef<HTMLDivElement>(null)

	useObserver(()=> {
		if (rootRef.current?.contains(document.activeElement))
			(document.activeElement as HTMLElement).blur?.()
	}, displayMode, "history", {filter: d=>!d})

	const handleClose = () => {
		setDisplay(false)
	}

	useEffect(() => {
		//on mouse wheel up display history
		const handleWheel = (e: WheelEvent) => {
			if (e.ctrlKey)
				return
			if (e.deltaY < 0 && !display && isViewAnyOf("text", "graphics", "dialog")) {
				if (!history.empty) // at least one element in the iterator
					setDisplay(true)
				script.autoPlay = false
			}
		}
		return addEventListener({event: 'wheel', handler: handleWheel})
	}, [setDisplay])

	useEffect(() => {
		if (display && view === "flowchart") {
			setView("history")
		}
	}, [display])
	 
	return (
		<div
			id="layer-history"
			{...divProps}
			className={classNames("layer", {"show": display}, divProps?.className)}
			ref={rootRef}>
			<div className='scroll-container' key={view}>
				{view === "history" ?
					<HistoryDisplay display={display} close={handleClose} />
				: view === "flowchart" ?
					<FlowchartDisplay display={display} />
				: null
				}
			</div>

			<FixedFooter>
				<Button
					variant="menu"
					onClick={handleClose}
				>
					{strings.close}
				</Button>
				<Button
					variant="menu"
					onClick={() => setView(prev => prev === "history" ? "flowchart" : "history")}
					style={{ marginLeft: '1em' }}
				>
					{view === "history" ? <>{strings.extra.scenes}</> : <>{strings.menu.history}</>}
				</Button>
			</FixedFooter>
		</div>
	)
}


export default HistoryLayer


type HistoryDisplayProps = {
	display: boolean
	close: () => void
}
const HistoryDisplay = ({ display, close }: HistoryDisplayProps) => {
	const historyRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		// scroll near the bottom of the history
		const historyElement = historyRef.current
		if (historyElement)
			historyElement.scrollTop = historyElement!.scrollHeight - historyElement!.clientHeight - 1
	}, [display])

	useEffect(() => {
		//when scrolled to the bottom of history, hide history
		const handleScroll = (e: any) => {
			const bottom = e.target.scrollHeight - Math.round(e.target.scrollTop) === e.target.clientHeight
			if (bottom)
				close()
		}
		return addEventListener({event: 'scroll', handler: handleScroll, element: historyRef.current})
	}, [historyRef])

	function onClick(saveState: SaveState) {
		close()
		loadSaveState(saveState)
	}

	return (
		<div id="history" ref={historyRef}>
			<div className="text-container">
				{Array.from(history, (page, i) =>
					<PageElement key={i} saveState={page} onLoad={onClick} />
				)}
			</div>
		</div>
	)
}

function setActiveScene(label: string) {
	const allScenes = document.querySelectorAll("[id^='fc-scene-']")
	allScenes.forEach(scene => scene.classList.remove("active"))
	if (gameContext.label.startsWith("skip")) {
		return
	}
	const sceneNode = document.getElementById(`fc-scene-${label}`)
	if (sceneNode) {
		sceneNode.classList.add("active")
		sceneNode.scrollIntoView({ behavior: "instant", block: "center" })
	}
}

type FlowchartDisplayProps = {
	display: boolean
}
const FlowchartDisplay = ({ display }: FlowchartDisplayProps) => {
	useObserver((label)=> {
		setActiveScene(label)

		//TODO: prevent loading a different scene until we are able to restore flags and affections
	}, gameContext, 'label')

	useEffect(() => {
		if (display) {
			setActiveScene(gameContext.label)
		}
	}, [display])

	return (
		<div id="scenes">
			<div className="flowchart-container">
				<Flowchart/>
			</div>
		</div>
	)
}