import gameLogo from "@assets/images/game-logo.webp"
import moon from "@assets/images/moon.webp"
import '@features/title-menu/styles/title-menu.scss'
import * as m from "motion/react-m"
import { MdOutlineVolumeOff, MdOutlineVolumeUp } from 'react-icons/md'
import { useObserved } from '@tsukiweb-common/utils/Observer'
import { useLocation } from "wouter"
import { history } from 'engine/history'
import { TitleMenuButton } from '@tsukiweb-common/ui-core'
import classNames from "classnames"
import { audio } from "engine/audio"
import { useRef } from "react"
import { useEclipseUnlocked } from "features/endings/hooks/useEclipseUnlocked";
import { continueGame, newGame, savesManager } from "engine/savestates";
import { settings } from "engine/settings";
import AppInfo from "features/title-menu/components/AppInfo";
import TranslationSwitch from "features/title-menu/components/TranslationSwitch";
import { strings } from "translation/lang";
import { SCREEN } from "app/utils/display";
import { useKeyArrows, useLanguageRefresh, useScreenAutoNavigate } from "app/hooks";


const TitleMenuScreen = () => {
	useScreenAutoNavigate(SCREEN.TITLE)
	useLanguageRefresh()
	useKeyArrows()

	return (
		<m.div
			className="page" id="title-menu"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<div className="logo">
				<m.img
					src={moon} alt="Full moon"
					draggable={false}
					className="moon"
					initial={{ opacity: 0.8, transform: "translateY(-42%) scale(0.94)" }}
					animate={{ opacity: 0.5, transform: "translateY(-50%) scale(1)" }}
					transition={{ duration: 0.8, ease: "easeOut" }} />
				<m.img
					src={gameLogo} alt="Game's logo in Japanese, subtitled in English"
					draggable={false}
					className='game-logo'
					initial={{ opacity: 0, transform: "scale(0.8)" }}
					animate={{ opacity: 1, transform: "scale(1)" }}
					transition={{ duration: 0.8, ease: "easeOut" }} />
			</div>

			<TitleMenu />

			<TopActions />
		</m.div>
	)
}

export default TitleMenuScreen


const TitleMenu = () => {
	const [, navigate] = useLocation()
	const { eclipseUnlocked } = useEclipseUnlocked()
	const canResume = useRef(savesManager.savesCount > 0 || history.pagesLength > 0)

	return (
		<nav className="menu">
			<div className='menu-buttons'>
				<TitleMenuButton audio={audio} onClick={newGame} nav-auto={1}>
					{strings.title.start}
				</TitleMenuButton>

				{canResume.current &&
				<TitleMenuButton audio={audio} onClick={continueGame} nav-auto={1}>
					{strings.title.resume}
				</TitleMenuButton>
				}

				<TitleMenuButton audio={audio} onClick={() => navigate(SCREEN.LOAD)} nav-auto={1}>
					{strings.title.load}
				</TitleMenuButton>

				<TitleMenuButton audio={audio} onClick={() => navigate(SCREEN.CONFIG)} nav-auto={1}>
					{strings.title.config}
				</TitleMenuButton>

				<TitleMenuButton audio={audio} onClick={() => navigate(SCREEN.GALLERY)} nav-auto={1}
					attention={eclipseUnlocked}>
					{strings.title.extra}
				</TitleMenuButton>
			</div>
		</nav>
	)
}

const TopActions = () => {
	const [conf] = useObserved(settings.volume, 'master')

	return (
		<div className='top-actions'>
			<m.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1, delay: 0.3 }}>
				<button
					nav-auto={1}
					className={classNames("action-icon", { inactive: conf < 0 })}
					onContextMenu={e => e.preventDefault()}
					aria-label={strings.config['volume-master']}
					onClick={()=> settings.volume.master = -settings.volume.master}
				>
					{conf < 0
						? <MdOutlineVolumeOff aria-label="mute" />
						: <MdOutlineVolumeUp aria-label="unmute" />
					}
				</button>
			</m.div>

			<m.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1, delay: 0.15 }}>
				<TranslationSwitch className="action-icon" nav-auto={1}/>
			</m.div>

			<m.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1 }}>
				<AppInfo className="action-icon" nav-auto={1}/>
			</m.div>
		</div>
	)
}