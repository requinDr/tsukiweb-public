import * as m from "motion/react-m"
import { PropsWithChildren, useEffect } from "react"
import "../styles/extra.scss"
import { strings } from "translation/lang"
import { useLocation } from "wouter"
import { PageTitle, TitleMenuButton } from "@tsukiweb-common/ui-core"
import { audio } from "engine/audio"
import { useEclipseUnlocked } from "features/endings/hooks/useEclipseUnlocked";
import { useLanguageRefresh } from "app/hooks";
import { SCREEN, displayMode } from "app/utils/display";
import { useDefaultNavBack } from "@tsukiweb-common/hooks"


const ExtraLayout = ({ children }: PropsWithChildren) => {
	return (
		<m.div
			id="extra"
			className="page-content"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<ExtraMenu />

			<m.div
				className="extra-content"
				initial={{y: -10, opacity: 0.4}}
				animate={{y: 0, opacity: 1}}
				exit={{y: 20, opacity: 0}}
				transition={{duration: 0.2}}
				key={location.pathname}
			>
				{children}
			</m.div>
		</m.div>
	)
}

export default ExtraLayout

function back() {
	displayMode.screen = SCREEN.TITLE
}

const ExtraMenu = () => {
	const [location, navigate] = useLocation()
	useLanguageRefresh()
	const { eclipseUnlocked } = useEclipseUnlocked()
	const currentPage = "/" + location.split("/")[1]

	useDefaultNavBack(back)

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

	return (
		<div className="extra-menu">
			<PageTitle>
				{strings.title.extra}
			</PageTitle>
			<div className="menus">
				<TitleMenuButton id="extra-gallery"
					audio={audio}
					onClick={()=>navigate(SCREEN.GALLERY)}
					active={currentPage === SCREEN.GALLERY}
					nav-auto={1}>
					{strings.extra.gallery}
				</TitleMenuButton>
				<TitleMenuButton id="extra-endings"
					audio={audio}
					onClick={()=>navigate(SCREEN.ENDINGS)}
					active={currentPage === SCREEN.ENDINGS}
					attention={eclipseUnlocked}
					nav-auto={1}>
					{strings.extra.endings}
				</TitleMenuButton>
				<TitleMenuButton id="extra-scenes"
					audio={audio}
					onClick={()=>navigate(SCREEN.SCENES)}
					active={currentPage === SCREEN.SCENES}
					nav-auto={1}>
					{strings.extra.scenes}
				</TitleMenuButton>
				<TitleMenuButton id="extra-plus-disc"
					audio={audio}
					onClick={()=>navigate(SCREEN.PLUS_DISC)}
					active={currentPage === SCREEN.PLUS_DISC}
					nav-auto={1}>
					Plus-Disc
				</TitleMenuButton>
			</div>
			<TitleMenuButton
				audio={audio}
				onClick={()=>navigate(SCREEN.TITLE)}
				className="back-button"
				nav-auto={1}>
				{`<<`} {strings.back}
			</TitleMenuButton>
		</div>
	)
}