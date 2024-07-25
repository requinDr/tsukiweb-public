import { Dispatch, useState } from "react"
import { MdGetApp, MdInfoOutline, MdOpenInNew, MdShare } from "react-icons/md"
import { toast } from "react-toastify"
import { bb } from "../../utils/Bbcode"
import { APP_VERSION } from "../../utils/constants"
import { strings } from "../../translation/lang"
import tsukiCover from "../../assets/images/tsukihime_cover.webp"
import Modal from "@tsukiweb-common/ui-core/components/Modal"
import BlueContainer from "@tsukiweb-common/ui-core/components/BlueContainer"
import MenuButton from "@tsukiweb-common/ui-core/components/MenuButton"
import Button from "@tsukiweb-common/ui-core/components/Button"
import usePWA from "@tsukiweb-common/hooks/usePWA"

const AppInfo = () => {
	const [show, setShow] = useState<boolean>(false)
	return (
		<>
			<button
				className="action-icon" 
				aria-label="show information modal"
				onClick={()=>setShow(true)}>
				<MdInfoOutline />
			</button>
			<ModalInfo show={show} setShow={setShow} />
		</>
	)
}

export default AppInfo


type ModalInfoProps = {
	show: boolean
	setShow: Dispatch<boolean>
}
const ModalInfo = ({show, setShow}: ModalInfoProps) => {
	const { canInstallPWA, installPWA } = usePWA()
	const copyCurrentUrl = () => {
		navigator.clipboard.writeText(window.location.href)
		toast("Page URL copied to clipboard", {
			toastId: "copy-url",
			type: "info",
			autoClose: 2000,
			closeButton: false,
			pauseOnHover: false,
		})
	}

	return (
		<Modal
			show={show}
			setShow={setShow}
			className="app-info-modale"
		>
			<div className='title-modal'>
				<div className='infos'>
					<div className="header">
						<BlueContainer className='version'>
							<span>v{APP_VERSION}</span>
							<a href="https://github.com/requinDr/tsukiweb-public" target="_blank" rel="noreferrer" style={{display: "inline-flex", alignItems: "center"}}>
								<img src="https://img.shields.io/github/stars/requinDr/tsukiweb-public?style=social" alt="stars" />
							</a>
						</BlueContainer>
					</div>

					<div className='content'>
						<div>
							{bb(strings.title.about.port)}
						</div>

						<div>
							{bb(strings.title.about.data
								.replace('$0', "[url='/config?tab=advanced']")
								.replace('$1', "[/url]"))}
						</div>

						<div>
							{bb(strings.title.about.project
								.replace('$0', "[url='https://github.com/requinDr/tsukiweb-public']")
								.replace('$1', "[/url]"))}
						</div>

						<div>
							{bb(strings.title.about.feedback
								.replace('$0', "[url='https://forms.gle/MJorV8oNbnKo22469']")
								.replace('$1', "[/url]"))}
						</div>

						<div className="more">
							{bb(strings.title.about.remake
								.replace('$0', "[url='http://typemoon.com/products/tsukihime/']")
								.replace('$1', "[/url]"))}
						</div>
					</div>
				</div>

				<div className="sidebar">
					<img src={tsukiCover} alt="tsukihime logo" className="tsuki-logo" draggable={false} />

					<BlueContainer className="card actions">
						<Button variant="corner" onClick={copyCurrentUrl}>
							<MdShare /> {strings.title.share}
						</Button>

						<Button variant="corner">
							<a href="https://vndb.org/v7" target="_blank" className="vndb">
								<MdOpenInNew />	<span>VNDB</span>
							</a>
						</Button>

						{canInstallPWA && 
							<Button variant="corner" onClick={installPWA}>
								<MdGetApp /> {strings.title.install}
							</Button>
						}
					</BlueContainer>
				</div>
			</div>

			<MenuButton onClick={()=>setShow(false)} className="close-btn">
				{strings.close}
			</MenuButton>
		</Modal>
	)
}