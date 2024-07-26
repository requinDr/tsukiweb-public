import { useEffect, useRef } from 'react';
import { displayMode, isViewAnyOf } from '../utils/display';
import { SaveState, loadSaveState } from "../utils/savestates";
import history from '../utils/history';
import script from '../utils/script';
import { strings } from '../translation/lang';
import PageElement from '../components/molecules/PageElement';
import FixedFooter from '@tsukiweb-common/ui-core/components/FixedFooter';
import MenuButton from '@tsukiweb-common/ui-core/components/MenuButton';
import { useObserved, useObserver } from '@tsukiweb-common/utils/Observer';
import { addEventListener } from '@tsukiweb-common/utils/utils';
import classNames from 'classnames';

type Props = {
	[key: string] : any // other properties to apply to the root 'div' element of the component
}
const HistoryLayer = (props: Props) => {
	const [display, setDisplay] = useObserved(displayMode, 'history')
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

	function onClick(saveState: SaveState) {
		setDisplay(false)
		loadSaveState(saveState)
	}
	 
	return (
		<div
			id="layer-history"
			{...props}
			className={classNames("layer", {"show": display}, props.className)}
			ref={rootRef}>
			<div id="history" ref={historyRef}>
				<div className="text-container">
					{Array.from(history, (page, i) =>
						<PageElement key={i} saveState={page} onLoad={onClick} />
					)}
				</div>
			</div>

			<FixedFooter>
				<MenuButton onClick={() => setDisplay(false)}>
					{strings.close}
				</MenuButton>
			</FixedFooter>
		</div>
	)
}


export default HistoryLayer
