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
import { audio } from "utils/audio"
import { Button } from "@tsukiweb-common/ui-core"

const AUDIO_PROPS = {
	audio: audio,
}
const LAYER_PROPS = {
	...AUDIO_PROPS,
	variant: "underline-left" as const,
	hoverSound: 'tick',
	clickSound: 'glass',
}
const ACTION_PROPS = {
	...AUDIO_PROPS,
	variant: null,
	clickSound: "impact"
}

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
							<Button {...LAYER_PROPS} onClick={graphicMode} nav-y={0}>
								{strings.menu["graphics"]}
							</Button>
							}
							{show?.history &&
							<Button {...LAYER_PROPS} onClick={historyMode} nav-y={1}>
								{strings.menu["history"]}
							</Button>
							}
							{show?.flowchart &&
							<Button {...LAYER_PROPS} onClick={flowchartMode} nav-y={2}>
								{strings.extra.scenes}
							</Button>
							}
							{show?.save &&
							<Button {...LAYER_PROPS} onClick={saveMode} nav-y={3}>
								{strings.menu["save"]}
							</Button>
							}
							{show?.load &&
							<Button {...LAYER_PROPS} onClick={loadMode} nav-y={4}>
								{strings.menu["load"]}
							</Button>
							}
							{show?.config &&
							<Button {...LAYER_PROPS} onClick={configMode} nav-y={5}>
								{strings.menu["config"]}
							</Button>
							}
							{show?.title &&
							<Button {...LAYER_PROPS} onClick={title} nav-y={6}>
								{strings.menu["title"]}
							</Button>
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
			<Button {...ACTION_PROPS} onClick={qSave} className="quick"
					nav-y={7} nav-x={0}>
				{strings.menu["q-save"]}
			</Button>
			}
			{show?.qLoad &&
			<Button {...ACTION_PROPS} onClick={qLoad} className="quick"
					nav-y={7} nav-x={1}>
				{strings.menu["q-load"]}
			</Button>
			}
			<Button {...ACTION_PROPS} onClick={toggleAutoPlay} className={isAutoplaying ? "on" : ""}
					aria-label="auto play" title={strings.menu["auto-play"]}
					nav-y={8} nav-x={0}>
				<MdPlayArrow />
			</Button>
			<Button {...ACTION_PROPS} onClick={fastForwardScene}
					aria-label="skip scene" title={strings.menu["ffw"]}
					nav-y={8} nav-x={1}>
				<MdFastForward />
			</Button>
			<Button {...ACTION_PROPS} onClick={toggleVolume}
					aria-label="mute/unmute" nav-y={9} nav-x={0}>
				{mute ? <MdOutlineVolumeOff /> : <MdOutlineVolumeUp />}
			</Button>
			<Button {...ACTION_PROPS} onClick={fullscreen.toggle}
					aria-label="toggle fullscreen" nav-y={9} nav-x={1}
					disabled={!fullscreen.isSupported}>
				{isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
			</Button>
			{show?.copyScene &&
			<Button {...ACTION_PROPS} onClick={copySceneToClipboard}
					className="fullwidth copy-scene" aria-label="copy scene link"
					nav-y={10} title={script.currentLabel ?? ""}
					disabled={script.currentLabel?.startsWith("skip")}>
				{strings.menu["copy-scene-url"]}
			</Button>
			}
		</div>
	)
}