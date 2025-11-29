import { useEffect, useRef, Activity } from "react"
import { MdCopyAll, MdFastForward, MdFullscreen, MdFullscreenExit, MdOutlineVolumeOff, MdOutlineVolumeUp, MdPlayArrow } from "react-icons/md"
import { settings } from "../utils/settings"
import { displayMode, InGameLayersHandler, SCREEN } from "../utils/display"
import { strings } from "../translation/lang"
import Ornament from "@assets/images/ornament.webp"
import { toast } from "react-toastify"
import { useObserved } from "@tsukiweb-common/utils/Observer"
import { fullscreen } from "@tsukiweb-common/utils/utils"
import useIsFullscreen from "@tsukiweb-common/hooks/useIsFullscreen"
import classNames from "classnames"
import { useDOMEvent } from "@tsukiweb-common/hooks/useDOMEvent"
import { ScriptPlayer } from "script/ScriptPlayer"
import useButtonSounds from "@tsukiweb-common/hooks/useButtonSounds"
import { audio } from "utils/audio"
import { navProps } from "@tsukiweb-common/input/arrowNavigation"


type Props = {
	display: boolean
	script: ScriptPlayer
	show?: Partial<{
		graphics: boolean
		history: boolean
		flowchart: boolean
		save: boolean
		load: boolean
		config: boolean
		title: boolean

		qSave: boolean
		qLoad: boolean
		copyScene: boolean
	}>
	layers: InGameLayersHandler
	qSave: VoidFunction
	qLoad: VoidFunction
}
const MenuLayer = ({display, script, show, layers, qSave, qLoad}: Props) => {
	const menuRef = useRef<HTMLDivElement>(null)

	useEffect(()=> {
		if (display) {
			//focus the menu when it appears
			requestAnimationFrame(()=> {
				menuRef.current?.focus()
			})
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
					<Activity mode={display ? "visible" : "hidden"}>
						<div className="top-spacer" />

						<div className="layer-btns">
							{show?.graphics &&
							<LayerButton onClick={graphicMode} navY={0}>
								{strings.menu["graphics"]}
							</LayerButton>
							}
							{show?.history &&
							<LayerButton onClick={historyMode} navY={1}>
								{strings.menu["history"]}
							</LayerButton>
							}
							{show?.flowchart &&
							<LayerButton onClick={flowchartMode} navY={2}>
								{strings.extra.scenes}
							</LayerButton>
							}
							{show?.save &&
							<LayerButton onClick={saveMode} navY={3}>
								{strings.menu["save"]}
							</LayerButton>
							}
							{show?.load &&
							<LayerButton onClick={loadMode} navY={4}>
								{strings.menu["load"]}
							</LayerButton>
							}
							{show?.config &&
							<LayerButton onClick={configMode} navY={5}>
								{strings.menu["config"]}
							</LayerButton>
							}
							{show?.title &&
							<LayerButton onClick={title} navY={6}>
								{strings.menu["title"]}
							</LayerButton>
							}
						</div>

						<ActionsButtons script={script} show={show}
							close={closeMenu} qSave={qSave} qLoad={qLoad}/>

					</Activity>
				</menu>
			</nav>
		</div>
	)
}

export default MenuLayer


type LayerButtonProps = {
	navY: number,
	children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>
const LayerButton = ({children, navY, ...props}: LayerButtonProps) => {
	const soundProps = useButtonSounds<HTMLButtonElement>(
		audio, 
		props,
		{ hoverSound: 'tick', clickSound: 'glass' }
	)
	
	return (
		<button {...soundProps} className="layer-btn" {...navProps(navY, 0)}>
			{children}
		</button>
	)
}

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
	const isFullscreen = useIsFullscreen()
	const isAutoplaying = false

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
	const toggleAutoPlay = () => {
		if (script.autoPlay) {
			script.autoPlay = false
		} else {
			script.autoPlay = true
			close()
		}
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
			<button onClick={qSave} className="quick" {...navProps(7, 0)}>
				{strings.menu["q-save"]}
			</button>
			}
			{show?.qLoad &&
			<button onClick={qLoad} className="quick" {...navProps(7, 1)}>
				{strings.menu["q-load"]}
			</button>
			}
			<button onClick={toggleAutoPlay} aria-label="auto play" className={isAutoplaying ? "on" : ""} title={strings.menu["auto-play"]} {...navProps(8, 0)}>
				<MdPlayArrow />
			</button>
			<button onClick={fastForwardScene} aria-label="skip scene" title={strings.menu["ffw"]} {...navProps(8, 1)}>
				<MdFastForward />
			</button>
			<button onClick={toggleVolume} aria-label="mute/unmute" {...navProps(9, 0)}>
				{mute ? <MdOutlineVolumeOff /> : <MdOutlineVolumeUp />}
			</button>
			<button onClick={fullscreen.toggle} aria-label="toggle fullscreen" disabled={!fullscreen.isSupported} {...navProps(9, 1)}>
				{isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
			</button>
			{show?.copyScene &&
			<button
				onClick={copySceneToClipboard}
				className="fullwidth copy-scene"
				aria-label="copy scene link"
				disabled={script.currentLabel?.startsWith("skip")}
				title={script.currentLabel ?? ""}
				{...navProps(10, 0)}
			>
				{strings.menu["copy-scene-url"]}
			</button>
			}
		</div>
	)
}