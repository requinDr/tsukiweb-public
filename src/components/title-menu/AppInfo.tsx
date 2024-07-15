import { Dispatch, useState } from "react"
import { MdInfoOutline, MdOpenInNew, MdShare } from "react-icons/md"
import { toast } from "react-toastify"
import { bb } from "../../utils/Bbcode"
import { APP_VERSION } from "../../utils/constants"
import { strings } from "../../translation/lang"
import tsukiCover from "../../assets/images/tsukihime_cover.webp"
import MenuButton from "@ui-core/components/MenuButton"
import Modal from "@ui-core/components/Modal"
import BlueContainer from "@ui-core/components/BlueContainer"

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
					<BlueContainer className='top'>
						<div>v{APP_VERSION}</div>
						<a href="https://github.com/requinDr/tsukiweb-public" target="_blank" rel="noreferrer">
							<img src="https://img.shields.io/github/stars/requinDr/tsukiweb-public?style=social" alt="stars" />
						</a>
						<MdShare
							title='Copy link'
							className='copy-link'
							onClick={copyCurrentUrl}
						/>
						<a href="https://vndb.org/v7" target="_blank" className="vndb">
							<MdOpenInNew />
							<span>VNDB</span>
						</a>
					</BlueContainer>

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
					</div>
				</div>

				<div className="sidebar">
					<BlueContainer className="card tsuki-logo">
						<img src={tsukiCover} alt="tsukihime logo" className="logo" draggable={false} />
					</BlueContainer>

					<BlueContainer className="card">
						{bb(strings.title.about.remake
							.replace('$0', "[url='http://typemoon.com/products/tsukihime/']")
							.replace('$1', "[/url]"))}
					</BlueContainer>
				</div>
			</div>

			<MenuButton onClick={()=>setShow(false)} className="close-btn">
				{strings.close}
			</MenuButton>
		</Modal>
	)
}