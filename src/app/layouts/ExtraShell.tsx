import * as m from "motion/react-m"
import { AnimatePresence } from "motion/react"
import { PropsWithChildren, useEffect, useRef } from "react"
import "../../features/title-menu/styles/extra.scss"
import { useStrings } from "translation/lang"
import { useLocation } from "wouter"
import { BackButton, HintsBar, PageHeader, PageSwitcher, PageTitle, TitleMenuButton } from "@tsukiweb/common/ui-core"
import { audio } from "engine/audio"
import { useEclipseUnlocked } from "features/endings/hooks/useEclipseUnlocked";
import { SCREEN, displayMode } from "app/utils/display";
import { useDefaultNavBack, useNavBackRef } from "@tsukiweb/common/hooks"
import Ornament from "@assets/images/ornament.webp"

type ExtraPage = {
	screen: SCREEN
	id: string
	label: string
	attention?: boolean
}

function back() {
	displayMode.screen = SCREEN.TITLE
}

function useExtraPages(): ExtraPage[] {
	const strings = useStrings()
	const { eclipseUnlocked } = useEclipseUnlocked()
	return [
		{ screen: SCREEN.GALLERY, id: "extra-gallery", label: strings.extra.gallery },
		{ screen: SCREEN.ENDINGS, id: "extra-endings", label: strings.extra.endings, attention: eclipseUnlocked },
		{ screen: SCREEN.SCENES, id: "extra-scenes", label: strings.extra.scenes },
		{ screen: SCREEN.PLUS_DISC, id: "extra-plus-disc", label: "Plus-Disc" },
	]
}

const ExtraShell = ({ children }: PropsWithChildren) => {
	const [location, navigate] = useLocation()
	const strings = useStrings()
	const pages = useExtraPages()
	const extraLocation = useRef(location)
	if (pages.some(({ screen }) => location.startsWith(screen)))
		extraLocation.current = location
	const currentPage = "/" + extraLocation.current.split("/")[1]

	const contentBack = () => {
		if (!document.body.classList.contains("keyboard-navigating"))
			return back()
		const currentPage = "/" + window.location.pathname.split("/")[1]
		document.querySelector<HTMLElement>(`#extra-${currentPage.slice(1)}`)?.focus()
	}

	const navBackRef = useNavBackRef(contentBack)

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
		<m.div
			id="extra"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<img src={Ornament} alt="" className="leftOrnament" />
			<img src={Ornament} alt="" className="rightOrnament" />

			<PageHeader className="extra-header"
				title={pages.find(({ screen }) => screen === currentPage)?.label ?? strings.title.extra} />

			<AnimatePresence mode="wait" initial={false}>
				<m.main
					className="extra-content"
					ref={navBackRef}
					initial={{opacity: 0}}
					animate={{opacity: 1, transition: {duration: 0.22, ease: "easeOut"}}}
					exit={{opacity: 0, transition: {duration: 0.12, ease: "easeIn"}}}
					key={extraLocation.current}
				>
					{children}
				</m.main>
			</AnimatePresence>

			<ExtraMenu pages={pages} currentPage={currentPage} navigate={navigate} />

			<HintsBar className="extra-footer" audio={audio} onBack={()=>navigate(SCREEN.TITLE)}>
				<PageSwitcher className="extra-switcher" audio={audio}
					pages={pages.map(({ screen, label, attention }) => ({ value: screen, label, attention }))}
					selected={currentPage}
					onSelect={navigate} />
			</HintsBar>
		</m.div>
	)
}

export default ExtraShell

type MenuProps = {
	pages: ExtraPage[]
	currentPage: string
	navigate: (screen: string) => void
}

const ExtraMenu = ({ pages, currentPage, navigate }: MenuProps) => {
	const strings = useStrings()

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
			<div className="back-action">
				<BackButton compact audio={audio} onClick={()=>navigate(SCREEN.TITLE)} nav-auto={1} />
			</div>
		</div>
	)
}
