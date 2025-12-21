import gameLogo from "@assets/images/tsukihime-logo.webp"
import moon from "@assets/images/moon.webp"
import '@styles/title-menu.scss'
import { SCREEN } from '../utils/display'
import * as m from "motion/react-m"
import { continueGame, newGame, savesManager } from '../utils/savestates'
import { strings } from "../translation/lang"
import { MdOutlineVolumeOff, MdOutlineVolumeUp } from 'react-icons/md'
import { settings } from '../utils/settings'
import AppInfo from '../components/title-menu/AppInfo'
import TranslationSwitch from '../components/title-menu/TranslationSwitch'
import { useObserved } from '@tsukiweb-common/utils/Observer'
import { useNavigate } from "react-router"
import history from 'utils/history'
import { TitleMenuButton } from '@tsukiweb-common/ui-core'
import { useScreenAutoNavigate, useLanguageRefresh } from 'hooks'
import useEclipseUnlocked from 'hooks/useEclipseUnlocked'
import classNames from "classnames"
import { audio } from "utils/audio"
import christmas_hat from '@assets/icons/christmas_hat.svg'
import useKeyArrows from "hooks/useKeyArrows"


const TitleMenuScreen = () => {
	const navigate = useNavigate()
	useScreenAutoNavigate(SCREEN.TITLE)
	useLanguageRefresh()
	useKeyArrows()
	const [conf] = useObserved(settings.volume, 'master')
	const { eclipseUnlocked } = useEclipseUnlocked()

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
					initial={{ opacity: 0.9, transform: "translateY(-42%) scale(0.9)" }}
					animate={{ opacity: 0.5, transform: "translateY(-50%) scale(1)" }}
					transition={{
						delay: 0,
						duration: 0.8,
						ease: "easeOut",
					}} />
				<m.img
					src={gameLogo} alt="Tsukihime logo"
					draggable={false}
					className='game-logo'
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{
						delay: 0,
						duration: 0.8,
						ease: "easeOut"
					}} />
			</div>

			<nav className="menu">
				<div className='menu-buttons'>
					<TitleMenuButton audio={audio} onClick={newGame} nav-auto={1}>
						{strings.title.start}
					</TitleMenuButton>

					{(savesManager.savesCount > 0 || history.pagesLength > 0) &&
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

			<div className='top-actions'>
				<m.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{
						delay: 0.8,
						duration: 1,
					}}>
					<button
						nav-auto={1}
						className={classNames("action-icon", { inactive: conf < 0 })}
						onContextMenu={e => e.preventDefault()}
						aria-label={strings.config['volume-master']}
						onClick={()=> settings.volume.master = -settings.volume.master}
					>
						{conf < 0 ? <MdOutlineVolumeOff aria-label="mute" /> : <MdOutlineVolumeUp aria-label="unmute" />}
						<img
							src={christmas_hat}
							alt="Christmas hat"
							className="christmas-hat"
							style={{
								position: 'absolute',
						    top: '-15px',
						    left: '-11px',
						    rotate: '-38deg',
						    width: '28px',
						    height: '28px',
								transform: 'scaleX(-1)',
							}}
						/>
					</button>
				</m.div>

				<m.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{
						delay: 0.7,
						duration: 1,
					}}>
					<TranslationSwitch className="action-icon" nav-auto={1}/>
				</m.div>

				<m.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{
						delay: 0.6,
						duration: 1,
					}}>
					<AppInfo className="action-icon" nav-auto={1}/>
				</m.div>
			</div>
		</m.div>
	)
}

export default TitleMenuScreen