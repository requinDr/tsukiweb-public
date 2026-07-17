import { useEffect, useRef } from "react"
import { MdCopyAll, MdFastForward, MdFullscreen, MdFullscreenExit, MdOutlineVolumeOff, MdOutlineVolumeUp, MdPlayArrow } from "react-icons/md"
import { toast } from "react-toastify"
import { useObserved } from "@tsukiweb/common/utils/Observer"
import { fullscreen } from "@tsukiweb/common/utils/utils"
import { useDOMEvent } from "@tsukiweb/common/hooks/useDOMEvent"
import { ScriptPlayer } from "engine/ScriptPlayer"
import { audio } from "engine/audio"
import { Button } from "@tsukiweb/common/ui-core"
import AnimatedHideActivityDiv from "@tsukiweb/common/ui-core/components/AnimatedHideActivityDiv"
import { isScene } from "engine/utils"
import FixedFooterOrnaments from "features/game/components/shared/FixedFooterOrnament"
import { useEventState, useIsFullscreen } from "@tsukiweb/common/hooks"
import { useStrings } from "translation/lang";
import { settings, viewedScene } from "engine/settings";
import { displayMode, SCREEN } from "app/utils/display";
import { InGameLayersHandler } from "@tsukiweb/common/utils/InGameLayersHandler";


const LAYER_PROPS = {
	variant: "underline-left" as const,
	audio: audio,
	hoverSound: 'tick',
	clickSound: 'glass',
}
const ACTION_PROPS = {
	variant: "select" as const,
	audio: audio,
	clickSound: "impact",
	"nav-auto": 1,
	"nav-up": '.layer-btns > :last-child',
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
	const strings = useStrings()
	const menuRef = useRef<HTMLDivElement>(null)
	const actionsRef = useRef<HTMLDivElement>(null)

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
		if (e.button === 0 && !menuRef.current?.contains(e.target as Node)
			&& !actionsRef.current?.contains(e.target as Node)) {
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
		<AnimatedHideActivityDiv
			show={display}
			showProps={{className: "show", 'nav-root': 1}}
			id="layer-menu"
			className="layer"
		>
			<nav className="menu-container" ref={menuRef}>
				<menu>
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
				</menu>
			</nav>

			<FixedFooterOrnaments className="footer" ref={actionsRef}>
				<ActionsButtons script={script} show={show}
					close={closeMenu} qSave={qSave} qLoad={qLoad}/>
			</FixedFooterOrnaments>
		</AnimatedHideActivityDiv>
	)
}

export default MenuLayer


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
	const strings = useStrings()
	const [mute] = useObserved(settings.volume, 'master', (vol)=>vol<0)
	const isFullscreen = useIsFullscreen()
	const [isAutoplaying] = useObserved(script, '_autoPlay')
	const [isFfw, setIsFfw] = useEventState(script, "ffwStart", "ffwStop")
	
	useEffect(() => {
		setIsFfw(script.fastForwarding)
	}, [script.fastForwarding, setIsFfw])

	const toggleVolume = () => {
		settings.volume.master = - settings.volume.master
	}
	const fastForward = ()=> {
		let currLabel = script.currentLabel
		if (currLabel)
			script.ffw((_line, _index, _page, _lines, label)=>{
				if (label == currLabel)
					return false
				if (isScene(label) && settings.enableSceneSkip && viewedScene(label))
					return true // user refused to skip already-seen scene
				return false
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
		toast.info(strings.title.copied, {
			autoClose: 2000,
			hideProgressBar: true,
			icon: () => <MdCopyAll />
		})
	}

	return (
		<div className="action-btns">
			{show?.qSave &&
			<Button {...ACTION_PROPS} onClick={qSave} className="quick">
				{strings.menu["q-save"]}
			</Button>
			}
			{show?.qLoad &&
			<Button {...ACTION_PROPS} onClick={qLoad} className="quick">
				{strings.menu["q-load"]}
			</Button>
			}
			<Button {...ACTION_PROPS} onClick={toggleAutoPlay} className={isAutoplaying ? "on" : ""}
				title={strings.menu["auto-play"]}
				aria-pressed={isAutoplaying}
				aria-label={strings.menu["auto-play"]}>
				<MdPlayArrow aria-hidden />
			</Button>
			<Button {...ACTION_PROPS} onClick={fastForward} className={isFfw ? "on" : ""}
				title={strings.menu["ffw"]}
				aria-pressed={isFfw}
				aria-label={strings.menu["ffw"]}>
				<MdFastForward aria-hidden />
			</Button>
			<Button {...ACTION_PROPS} onClick={toggleVolume} className={mute ? "off" : ""}
				aria-label={mute ? "volume off" : "volume up"}>
				{mute
					? <MdOutlineVolumeOff aria-hidden />
					: <MdOutlineVolumeUp aria-hidden />
				}
			</Button>
			{fullscreen.isSupported &&
			<Button {...ACTION_PROPS} onClick={fullscreen.toggle}
				aria-pressed={isFullscreen}
				aria-label={isFullscreen ? "exit fullscreen" : "enter fullscreen"}>
				{isFullscreen
					? <MdFullscreenExit aria-hidden />
					: <MdFullscreen aria-hidden />
				}
			</Button>
			}
			{show?.copyScene &&
			<Button {...ACTION_PROPS} onClick={copySceneToClipboard}
				className="fullwidth copy-scene" title={script.currentLabel ?? ""}
				disabled={script.currentLabel?.startsWith("skip")}>
				{strings.menu["copy-scene-url"]}
			</Button>
			}
		</div>
	)
}