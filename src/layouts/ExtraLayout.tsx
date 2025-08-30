import * as motion from "motion/react-m"
import { PropsWithChildren, useEffect } from "react"
import "@styles/extra.scss"
import { strings } from "translation/lang"
import { displayMode, SCREEN } from "utils/display"
import { useLocation } from "react-router-dom"
import { TitleMenuButton } from "@tsukiweb-common/ui-core"
import { useLanguageRefresh } from "hooks/useLanguageRefresh"
import useEclipseUnlocked from "hooks/useEclipseUnlocked"
import { settings } from "utils/settings"

const ExtraLayout = ({ children }: PropsWithChildren) => {
	const location = useLocation()
	useLanguageRefresh()
	const { eclipseUnlocked } = useEclipseUnlocked()

	function back() {
		displayMode.screen = SCREEN.TITLE
	}

	useEffect(()=> {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				back()
			}
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => {
			window.removeEventListener("keydown", handleKeyDown)
		}
	}, [])

	const currentPage = "/" + location.pathname.split("/")[1]

	return (
		<motion.div
			id="extra"
			className="page-content"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<div className="extra-menu">
				<h2 className="page-title">
					{strings.title.extra}
				</h2>
				<div className="menus">
					<TitleMenuButton
						to={SCREEN.GALLERY}
						active={currentPage === SCREEN.GALLERY}>
						{strings.extra.gallery}
					</TitleMenuButton>
					<TitleMenuButton
						to={SCREEN.ENDINGS}
						active={currentPage === SCREEN.ENDINGS}
						attention={eclipseUnlocked}>
						{strings.extra.endings}
					</TitleMenuButton>
					<TitleMenuButton
						to={SCREEN.SCENES}
						active={currentPage === SCREEN.SCENES}>
						{strings.extra.scenes}
					</TitleMenuButton>
					{import.meta.env.DEV && settings.unlockEverything &&
					<TitleMenuButton
						to={SCREEN.CHARACTERS}
						active={currentPage === SCREEN.CHARACTERS}>
						Characters
					</TitleMenuButton>
					}
					<TitleMenuButton
						to={SCREEN.PLUS_DISC}
						active={currentPage === SCREEN.PLUS_DISC}>
						Plus-Disc
					</TitleMenuButton>

					<TitleMenuButton
						to={SCREEN.TITLE}
						className="back-button">
						{`<<`} {strings.back}
					</TitleMenuButton>
				</div>
			</div>

			<motion.div
				className="extra-content"
				initial={{y: -10, opacity: 0.4}}
				animate={{y: 0, opacity: 1}}
				exit={{y: 20, opacity: 0}}
				transition={{duration: 0.2}}
				key={location.pathname}
			>
				{children}
			</motion.div>
		</motion.div>
	)
}

export default ExtraLayout