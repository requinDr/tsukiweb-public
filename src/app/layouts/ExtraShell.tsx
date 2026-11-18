import * as m from "motion/react-m"
import { PropsWithChildren, useEffect } from "react"
import "../../features/title-menu/styles/extra.scss"
import { useStrings } from "translation/lang"
import { useLocation } from "wouter"
import { PageSwitcher, PageTitle, TitleMenuButton } from "@tsukiweb/common/ui-core"
import { audio } from "engine/audio"
import { useEclipseUnlocked } from "features/endings/hooks/useEclipseUnlocked";
import { SCREEN, displayMode } from "app/utils/display";
import { useDefaultNavBack, useNavBackRef } from "@tsukiweb/common/hooks"
import Ornament from "@assets/images/ornament.webp"
import PageBackButton from "app/components/PageBackButton"

const ExtraShell = ({ children }: PropsWithChildren) => {
	const focusCurrentMenuItem = () => {
		const currentPage = "/" + window.location.pathname.split("/")[1]
		document.querySelector<HTMLElement>(`#extra-${currentPage.slice(1)}`)?.focus()
	}

	return (
		<m.div
			id="extra"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<img src={Ornament} alt="" className="leftOrnament" />
			<img src={Ornament} alt="" className="rightOrnament" />

			<m.main
				className="extra-content"
				ref={useNavBackRef(focusCurrentMenuItem)}
				initial={{y: -10, opacity: 0.4}}
				animate={{y: 0, opacity: 1}}
				exit={{y: 20, opacity: 0}}
				transition={{duration: 0.2}}
				key={window.location.pathname}
			>
				{children}
			</m.main>

			<ExtraMenu />
		</m.div>
	)
}

export default ExtraShell

type ExtraPage = {
	screen: SCREEN
	id: string
	label: string
	attention?: boolean
}

function back() {
	displayMode.screen = SCREEN.TITLE
}

const ExtraMenu = () => {
	const strings = useStrings()
	const [location, navigate] = useLocation()
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

	const pages: ExtraPage[] = [
		{ screen: SCREEN.GALLERY, id: "extra-gallery", label: strings.extra.gallery },
		{ screen: SCREEN.ENDINGS, id: "extra-endings", label: strings.extra.endings, attention: eclipseUnlocked },
		{ screen: SCREEN.SCENES, id: "extra-scenes", label: strings.extra.scenes },
		{ screen: SCREEN.PLUS_DISC, id: "extra-plus-disc", label: "Plus-Disc" },
	]

	return (
		<div className="extra-menu">
			<PageTitle>
				{strings.title.extra}
			</PageTitle>
			<div className="menus" role="tablist">
				{pages.map(({ screen, id, label, attention }) =>
					<TitleMenuButton key={id} id={id}
						audio={audio}
						onClick={()=>navigate(screen)}
						active={currentPage === screen}
						aria-selected={currentPage === screen}
						attention={attention}
						role="tab"
						nav-auto={1}>
						{label}
					</TitleMenuButton>
				)}
			</div>
			<PageSwitcher className="extra-switcher" audio={audio}
				pages={pages.map(({ screen, label, attention }) => ({ value: screen, label, attention }))}
				selected={currentPage}
				onSelect={navigate} />
			<div className="back-action">
				<PageBackButton onClick={()=>navigate(SCREEN.TITLE)} />
			</div>
		</div>
	)
}