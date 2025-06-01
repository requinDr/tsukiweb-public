import { useEffect, useRef, useState } from "react"
import { MdCopyAll, MdFastForward, MdFullscreen, MdFullscreenExit, MdOutlineVolumeOff, MdOutlineVolumeUp, MdPlayArrow } from "react-icons/md"
import { settings } from "../utils/settings"
import { displayMode, InGameLayersHandler, SCREEN } from "../utils/display"
import { strings } from "../translation/lang"
import Ornament from "../assets/images/ornament.webp"
import { toast } from "react-toastify"
import { useObserved } from "@tsukiweb-common/utils/Observer"
import { isFullscreen, toggleFullscreen, supportFullscreen } from "@tsukiweb-common/utils/utils"
import classNames from "classnames"
import { useDOMEvent } from "@tsukiweb-common/hooks/useDOMEvent"
import { ScriptPlayer } from "script/ScriptPlayer"


type Props = {
	script: ScriptPlayer
	show?: Partial<{
		graphics: boolean
		history: boolean
		flowchart: boolean
		save: boolean
		load: boolean
		config: boolean
		title: boolean

		sceneName: boolean
		qSave: boolean
		qLoad: boolean
		copyScene: boolean
	}>
	layers: InGameLayersHandler
	qSave: VoidFunction
	qLoad: VoidFunction
}
const MenuLayer = ({script, show, layers, qSave, qLoad}: Props) => {
	const menuRef = useRef<HTMLDivElement>(null)
	const display = layers.menu

	useEffect(()=> {
		if (display) {
			//focus the menu when it appears
			setTimeout(()=> {
				menuRef.current?.focus()
			}, 100)
		} else if (menuRef.current?.contains(document.activeElement))
			(document.activeElement as HTMLElement).blur?.();
	}, [display])

	useDOMEvent((e: MouseEvent)=> {
		//if a left click is made outside the menu, hide it
		if (e.button === 0 && !menuRef.current?.contains(e.target as Node)) {
			layers.menu = false
		}
	}, window, 'mousedown')

	const graphicMode   = () => { layers.graphics  = true }
	const historyMode   = () => { layers.history   = true }
	const flowchartMode = () => { layers.flowchart = true }
	const saveMode      = () => { layers.save      = true }
	const loadMode      = () => { layers.load      = true }
	const configMode    = () => { layers.config    = true }

	const closeMenu = () => { layers.menu = false }

	const title = () => {
		closeMenu()
		displayMode.screen = SCREEN.TITLE
	}

	return (
		<div id="layer-menu"
			className={classNames("layer", {show: display})}
		>
			<img src={Ornament} alt="ornament" className="bottom-ornament" />
			<img src={Ornament} alt="ornament" className="top-ornament" />
			<nav className="menu-container" ref={menuRef}>
				<menu>
					<div className="top" />

					<div className="layer-btns">
						{show?.graphics &&
						<button onClick={graphicMode} className="layer-btn">
							{strings.menu["graphics"]}
						</button>
						}
						{show?.history &&
						<button onClick={historyMode} className="layer-btn">
							{strings.menu["history"]}
						</button>
						}
						{show?.flowchart &&
						<button onClick={flowchartMode} className="layer-btn">
							{strings.extra.scenes}
						</button>
						}
						{show?.save &&
						<button onClick={saveMode} className="layer-btn">
							{strings.menu["save"]}
						</button>
						}
						{show?.load &&
						<button onClick={loadMode} className="layer-btn">
							{strings.menu["load"]}
						</button>
						}
						{show?.config &&
						<button onClick={configMode} className="layer-btn">
							{strings.menu["config"]}
						</button>
						}
						{show?.title &&
						<button onClick={title} className="layer-btn">
							{strings.menu["title"]}
						</button>
						}
					</div>

					<ActionsButtons script={script} show={show}
						close={closeMenu} qSave={qSave} qLoad={qLoad}/>
				</menu>
			</nav>
		</div>
	)
}

export default MenuLayer

/**
 * TODO
 * - Go to next scene
 */
type ActionsButtonsProps = {
	script: ScriptPlayer
	show?: Partial<{
		qSave: boolean
		qLoad: boolean
		copyScene: boolean
	}>
	close: VoidFunction
	qSave: VoidFunction
	qLoad: VoidFunction
}
const ActionsButtons = ({script, show, close, qSave, qLoad}: ActionsButtonsProps) => {
	const [mute] = useObserved(settings.volume, 'master', (vol)=>vol<0)
	const [fullscreen, setFullscreen] = useState<boolean>(isFullscreen())

	useDOMEvent(()=> {
		setFullscreen(isFullscreen())
	}, document, "fullscreenchange")

	const toggleVolume = () => {
		settings.volume.master = - settings.volume.master
	}
	const fastForwardScene = ()=> {
		const currLabel = script.currentLabel
		if (currLabel)
			script.ffw((_line, _index, _page, _lines, label)=>{
				return label != currLabel
			}, settings.fastForwardDelay)
		close()
	}
	const autoPlay = () => {
		script.autoPlay = true
		close()
	}
	
	const copySceneToClipboard = () => {
		navigator.clipboard.writeText(
			`${window.location.origin}/scenes/${script.currentLabel??""}`
		)
		toast.info("Scene link copied to clipboard", {
			autoClose: 2000,
			hideProgressBar: true,
			icon: () => <MdCopyAll />
		})
	}

	return (
		<div className="action-btns">
			{show?.qSave &&
			<button onClick={qSave} className="quick">
				{strings.menu["q-save"]}
			</button>
			}
			{show?.qLoad &&
			<button onClick={qLoad} className="quick">
				{strings.menu["q-load"]}
			</button>
			}
			<button onClick={autoPlay} aria-label="auto play" title={strings.menu["auto-play"]}>
				<MdPlayArrow />
			</button>
			<button onClick={fastForwardScene} aria-label="skip scene" title={strings.menu["ffw"]}>
				<MdFastForward />
			</button>
			<button onClick={toggleVolume} aria-label="mute/unmute">
				{mute ? <MdOutlineVolumeOff /> : <MdOutlineVolumeUp />}
			</button>
			<button onClick={toggleFullscreen} aria-label="toggle fullscreen" disabled={!supportFullscreen()}>
				{fullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
			</button>
			{show?.copyScene &&
			<button
				onClick={copySceneToClipboard}
				className="fullwidth copy-scene"
				aria-label="copy scene link"
				disabled={script.currentLabel?.startsWith("skip")}
				title={script.currentLabel ?? ""}
			>
				<MdCopyAll style={{marginRight: 8}} /> {strings.menu["copy-scene-url"]}
			</button>
			}
		</div>
	)
}