import MenuButton from "@ui-core/components/MenuButton"
import Modal from "@ui-core/components/Modal"
import { Dispatch } from "react"
import { MdOpenInNew } from "react-icons/md"
import { languages, strings } from "translation/lang"
import { settings } from "utils/settings"
import { deepAssign } from "utils/utils"

type Props = {
	show: boolean
	setShow: Dispatch<boolean>
}
const ModalLanguageSelection = ({show, setShow}: Props) => {
	const selectLanguage = (id: string) => {
		deepAssign(settings, {language: id})
	}

	return (
		<Modal
			show={show}
			setShow={setShow}
			className="translation-switch-modale"
		>
			<div className="content">
				<div className="languages">
					{...Object.entries(languages)
						.sort((a, b) => a[1]["display-name"].localeCompare(b[1]["display-name"]))
						.map(([id, {"display-name": dispName}]) => {
						const selected = settings.language === id
						
						return (
							<button key={id}
								className={`language ${selected ? 'selected' : ''}`}
								onClick={()=>selectLanguage(id)}
							>
								<div>{dispName}</div>
							</button>
						)
					})}
				</div>

				<div className="translation-details">
					{settings.language !== "jp" && <>
						<div className="line title">
							{strings.translation.name}
						</div>
						<div className="line">
							{strings.translation.desc}
						</div>
						<div className="line" style={{marginTop: "1em"}}>
							<a href={strings.translation.url} target="_blank">
								<MdOpenInNew /> {strings.translation.url}
							</a>
						</div>
						<div className="line">
							<a href={strings.translation.vndb} target="_blank">
								<MdOpenInNew /> {strings.translation.vndb}
							</a>
						</div>
					</>}
				</div>
			</div>

			<MenuButton onClick={()=>setShow(false)} className="close-btn">
				{strings.close}
			</MenuButton>
		</Modal>
	)
}

export default ModalLanguageSelection