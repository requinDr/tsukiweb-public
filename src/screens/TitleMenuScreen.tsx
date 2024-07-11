import { useMemo, useState } from 'react'
import tsukiLogo from "../assets/images/tsukihime-logo.webp"
import moon from "../assets/images/moon.webp"
import '../styles/title-menu.scss'
import { SCREEN, displayMode } from '../utils/display'
import { motion } from 'framer-motion'
import { blankSaveState, getLastSave, hasSaveStates, loadSaveFiles, loadSaveState, viewedScene } from '../utils/savestates'
import history from '../utils/history'
import { strings } from "../translation/lang"
import { MdGetApp } from 'react-icons/md'
import { settings } from '../utils/settings'
import { endings } from '../utils/endings'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate'
import TitleMenuButton from '../components/atoms/TitleMenuButton'
import AppInfo from '../components/title-menu/AppInfo'
import TranslationSwitch from '../components/title-menu/TranslationSwitch'
import usePWA from '../components/hooks/usePWA'
import Particles from '@ui-core/components/Particles'
import ExtraMenu from 'components/title-menu/ExtraMenu'

const img = {
	src: moon,
	alt: "moon",
	className: "moon"
}

const TitleMenuScreen = () => {
	useScreenAutoNavigate(SCREEN.TITLE)
	const { hasPWAcapability, installPWA } = usePWA()
	const [page, setPage] = useState<number>(0)
	useLanguageRefresh()

	function newGame() {
		history.clear()
		loadSaveState(blankSaveState())
		displayMode.screen = SCREEN.WINDOW
	}

	async function continueGame() {
		// restart from beginning of last visisted page ...
		const lastSave = history.last
								// or from last saved game
								?? getLastSave()
								// or ask user to provide save file(s).
								// Also retrieve settings from the save file(s)
								?? await loadSaveFiles().then(getLastSave)
		if (lastSave) {
			loadSaveState(lastSave)
			displayMode.screen = SCREEN.WINDOW
		}
	}

	const [allEndingsSeen, eclipseSeen] = useMemo(()=> {
		const allEndingsSeen = Object.values(endings).every(e=>e.seen)
		const eclipseSeen = viewedScene("eclipse")
		return [allEndingsSeen, eclipseSeen]
	}, [settings.completedScenes])

	return (
		<motion.div
			className="page" id="title-menu"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>

			<Particles />

			<div className="logo">
				<motion.img src={img.src} alt={img.alt} draggable={false} className={img.className}
					initial={{ opacity: 0.9, transform: "translateY(-42%) scale(0.9)" }}
					animate={{ opacity: 0.5, transform: "translateY(-50%) scale(1)" }}
					transition={{
						delay: 0,
						duration: 1,
					}} />
				<motion.img
					src={tsukiLogo} alt="tsukihime logo"
					draggable={false}
					className='tsuki-logo'
					initial={{ opacity: 0, scale: 0.7 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{
						delay: 0.4,
						duration: 0.8,
					}} />
			</div>

			<nav className="menu">
				{page === 0 ?
				<>
					<div className='first-row'>
						<TitleMenuButton onClick={newGame}>
							{strings.title.start}
						</TitleMenuButton>

						{hasSaveStates() &&
						<TitleMenuButton onClick={continueGame}>
							{strings.title.resume}
						</TitleMenuButton>
						}

						<TitleMenuButton to={SCREEN.LOAD}>
							{strings.title.load}
						</TitleMenuButton>

						<TitleMenuButton to={SCREEN.CONFIG}>
							{strings.title.config}
						</TitleMenuButton>

						<TitleMenuButton onClick={()=>setPage(1)}
							className="extra"
							attention={allEndingsSeen && !eclipseSeen}>
							{strings.title.extra} {">"}
						</TitleMenuButton>
					</div>

					<div className='second-row'>
						<ExtraMenu allEndingsSeen={allEndingsSeen} eclipseSeen={eclipseSeen} />
					</div>
				</>
				:
				<>
					<div className='first-row'>
						<ExtraMenu allEndingsSeen={allEndingsSeen} eclipseSeen={eclipseSeen} />

						<TitleMenuButton onClick={()=>setPage(0)}>
							{"<"}  {strings.back}
						</TitleMenuButton>
					</div>
				</>
				}
			</nav>

			<div className='top-actions'>
				{hasPWAcapability &&
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{
							delay: 0.8,
							duration: 1,
						}}>
						<button
							className="action-icon"
							aria-label={strings.title.install}
							onClick={installPWA}>
							<MdGetApp />
						</button>
					</motion.div>
				}

				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{
						delay: 0.7,
						duration: 1,
					}}>
					<TranslationSwitch />
				</motion.div>

				<motion.div         
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{
						delay: 0.6,
						duration: 1,
					}}>
					<AppInfo />
				</motion.div>
			</div>
		</motion.div>
	)
}

export default TitleMenuScreen