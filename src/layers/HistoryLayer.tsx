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
	const historyRef = useRef<HTMLDivElement>(null)

	useObserver(()=> {
		if (rootRef.current?.contains(document.activeElement))
			(document.activeElement as HTMLElement).blur?.()
	}, displayMode, "history", {filter: d=>!d})

	useEffect(() => {
		//on mouse wheel up display history
		const handleWheel = (e: WheelEvent) => {
			if (e.ctrlKey)
				return
			if (e.deltaY < 0 && !display && isViewAnyOf("text", "graphics", "dialog")) {
				if (!history.empty) // at least one element in the iterator
					setDisplay(true)
				script.autoPlay = false
			} else if (e.deltaY > 0 && display && historyRef.current?.scrollHeight == historyRef.current?.clientHeight) {
				setDisplay(false)
			}
		}
		return addEventListener({event: 'wheel', handler: handleWheel})
	})

	useEffect(() => {
		//when scrolled to the bottom of history, hide history
		const handleScroll = (e: any) => {
			const bottom = e.target.scrollHeight - Math.round(e.target.scrollTop) === e.target.clientHeight
			if (bottom) {
				setDisplay(false)
			}
		}
		return addEventListener({event: 'scroll', handler: handleScroll, element: historyRef.current})
	})

	useEffect(() => {
		//scroll to the bottom of history
		if (display) {
			const historyElement = historyRef.current
			if (historyElement)
				historyElement.scrollTop = historyElement!.scrollHeight - historyElement!.clientHeight - 1
		}
	}, [display])

	//TODO: only process when gameContext label changes
	const allScenes = document.querySelectorAll("[id^='fc-scene-']");
	allScenes.forEach(scene => scene.classList.remove("active"));
	const scene = document.getElementById(`fc-scene-${gameContext.label}`);
	if (scene) {
		scene.classList.add("active");
	}

	//TODO: auto-scroll to the current scene
	//TODO: prevent loading a different scene until we are able to restore flags and affections

	function onClick(saveState: SaveState) {
		setDisplay(false)
		loadSaveState(saveState)
	}
	 
	return (
		<div
			id="layer-history"
			{...divProps}
			className={classNames("layer", {"show": display}, divProps?.className)}
			ref={rootRef}>
			<div ref={historyRef} className='scroll-container'>
				{view === "history" ?
				<div id="history">
					<div className="text-container">
						{Array.from(history, (page, i) =>
							<PageElement key={i} saveState={page} onLoad={onClick} />
						)}
					</div>
				</div>
				:
				<div id="scenes">
					<div className="flowchart-container">
						<Flowchart />
					</div>
				</div>
				}
			</div>

			<FixedFooter>
				<Button
					variant="menu"
					onClick={() => setDisplay(false)}
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
