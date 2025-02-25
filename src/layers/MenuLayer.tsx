import { useEffect, useRef, useState } from "react"
import { MdCopyAll, MdFastForward, MdFullscreen, MdFullscreenExit, MdOutlineVolumeOff, MdOutlineVolumeUp, MdPlayArrow } from "react-icons/md"
import { gameContext } from "../utils/variables"
import { settings } from "../utils/settings"
import { quickLoad, quickSave } from "../utils/savestates"
import script from "../utils/script"
import { displayMode, SCREEN } from "../utils/display"
import { strings } from "../translation/lang"
import Ornament from "../assets/images/ornament.webp"
import { toast } from "react-toastify"
import { useObserved } from "@tsukiweb-common/utils/Observer"
import { isFullscreen, toggleFullscreen, addEventListener, supportFullscreen } from "@tsukiweb-common/utils/utils"
import classNames from "classnames"


type Props = {
	show?: Partial<{
		graphics: boolean
		history: boolean
		save: boolean
		load: boolean
		config: boolean
		title: boolean

		sceneName: boolean
		qSave: boolean
		qLoad: boolean
		copyScene: boolean
	}>
}
const MenuLayer = ({show}: Props) => {
	const menuRef = useRef<HTMLDivElement>(null)
	const [display] = useObserved(displayMode, 'menu')

	useEffect(()=> {
		if (!display && menuRef.current?.contains(document.activeElement))
			(document.activeElement as HTMLElement).blur?.();
	}, [display])

	useEffect(() => {
		//if a left click is made outside the menu, hide it
		const handleClick = (e: MouseEvent) => {
			if (e.button === 0 && displayMode.menu && !menuRef.current?.contains(e.target as Node)) {
				displayMode.menu = false
			}
		}
		return addEventListener({event: 'mousedown', handler: handleClick})
	})

	const graphicMode = () => {
		displayMode.graphics = !displayMode.graphics;
		displayMode.menu = false
	}

	const historyMode = () => {
		displayMode.menu = false
		displayMode.history = true
	}

	const saveMode = () => {
		displayMode.menu = false
		displayMode.save = true
	}

	const loadMode = () => {
		displayMode.menu = false
		displayMode.load = true
	}

	const configMode = () => {
		displayMode.menu = false
		displayMode.config = true
	}

	const title = () => {
		displayMode.screen = SCREEN.TITLE
		displayMode.menu = false
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

					<ActionsButtons show={show} />
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
	show?: Partial<{
		qSave: boolean
		qLoad: boolean
		copyScene: boolean
	}>
}
const ActionsButtons = ({show}: ActionsButtonsProps) => {
	const [mute] = useObserved(settings.volume, 'master', (vol)=>vol<0)
	const [fullscreen, setFullscreen] = useState<boolean>(isFullscreen())

	useEffect(()=> {
		return addEventListener({event: 'fullscreenchange', handler: ()=> {
			setFullscreen(isFullscreen())
		}})
	}, [])

	const toggleVolume = () => {
		settings.volume.master = - settings.volume.master
	}
	const fastForwardScene = ()=> {
		const currLabel = gameContext.label
		script.fastForward((_l, _i, label)=> label != currLabel)
		displayMode.menu = false
	}
	const autoPlay = () => {
		displayMode.menu = false
		script.autoPlay = true
	}
	const copySceneToClipboard = () => {
		navigator.clipboard.writeText(
			`${window.location.origin}/scenes/${gameContext.label}`
		)
		toast.info("Scene link copied to clipboard", {autoClose: 2000})
	}

	return (
		<div className="action-btns">
			{show?.qSave &&
			<button onClick={quickSave} className="quick">
				{strings.menu["q-save"]}
			</button>
			}
			{show?.qLoad &&
			<button onClick={quickLoad} className="quick">
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
				disabled={gameContext.label.startsWith("skip")}
				title={gameContext.label}
			>
				<MdCopyAll style={{marginRight: 8}} /> Copy scene link
			</button>
			}
		</div>
	)
}