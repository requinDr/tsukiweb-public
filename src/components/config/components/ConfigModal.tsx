import MenuButton from "@tsukiweb-common/ui-core/components/MenuButton"
import Modal from "@tsukiweb-common/ui-core/components/Modal"
import { Dispatch, ReactNode } from "react"
import { strings } from "translation/lang"
import Ornament from "../../../assets/images/ornament.webp"

type Props = {
	modal: {show: boolean, content: ReactNode},
	setModal: Dispatch<{show: boolean, content: ReactNode}>
}
const ConfigModal = ({modal, setModal}: Props) => {
	const close = () => setModal({show: false, content: undefined})

	return (
		<Modal
			show={modal.show} 
			setShow={close}
			className="config-modal"
		>
			<img src={Ornament} alt="ornament" className="ornament" />
			<div className="modal-content">
				{modal.content}
			</div>
			<MenuButton onClick={close}
				className="close-btn">
				{strings.close}
			</MenuButton>
		</Modal>
	)
}

export default ConfigModal