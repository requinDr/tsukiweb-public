import * as motion from "motion/react-m"
import { PropsWithChildren, useEffect, useMemo } from "react"
import "../styles/extra.scss"
import { strings } from "translation/lang"
import { displayMode, SCREEN } from "utils/display"
import { viewedScene } from "utils/savestates"
import { useLocation, useNavigate } from "react-router-dom"
import { useLanguageRefresh } from "components/hooks/useLanguageRefresh"
import { endings } from "utils/endings"
import { settings } from "utils/settings"
import TitleMenuButton from "@tsukiweb-common/ui-core/components/TitleMenuButton"

const ExtraLayout = ({ children }: PropsWithChildren) => {
	const navigate = useNavigate()
	const location = useLocation()
	useLanguageRefresh()

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

	const [allEndingsSeen, eclipseSeen] = useMemo(()=> {
		const allEndingsSeen = settings.unlockEverything || Object.values(endings).every(e=>e.seen)
		const eclipseSeen = settings.unlockEverything || viewedScene("eclipse")
		return [allEndingsSeen, eclipseSeen]
	}, [settings.completedScenes, settings.unlockEverything])

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
						onClick={()=>navigate(SCREEN.GALLERY)}
						active={currentPage === SCREEN.GALLERY}>
						{strings.extra.gallery}
					</TitleMenuButton>
					<TitleMenuButton
						onClick={()=>navigate(SCREEN.ENDINGS)}
						active={currentPage === SCREEN.ENDINGS}
						attention={allEndingsSeen && !eclipseSeen}>
						{strings.extra.endings}
					</TitleMenuButton>
					<TitleMenuButton
						onClick={()=>navigate(SCREEN.SCENES)}
						active={currentPage === SCREEN.SCENES}>
						{strings.extra.scenes}
					</TitleMenuButton>
					{import.meta.env.DEV &&
					<TitleMenuButton
						onClick={()=>navigate(SCREEN.PLUS_DISC)}
						active={currentPage === SCREEN.PLUS_DISC}>
						Plus Disc
					</TitleMenuButton>
					}

					<TitleMenuButton onClick={()=>navigate(SCREEN.TITLE)} className="back-button">
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