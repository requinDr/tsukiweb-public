import { Dispatch, ReactNode } from "react"
import { strings } from "translation/lang"
import { Button, Modal } from "@tsukiweb-common/ui-core"
import { audio } from "utils/audio"

type Props = {
	modal: {show: boolean, content: ReactNode},
	setModal: Dispatch<{show: boolean, content: ReactNode}>
}
const ConfigModal = ({modal, setModal}: Props) => {
	const close = () => setModal({show: false, content: modal.content})

	return (
		<Modal
			show={modal.show} 
			onRequestClose={close}
			className="config-modal"
		>
			<div className="modal-content">
				{modal.content}
			</div>
			<Button
				variant="elevation"
				onClick={close}
				className="close-btn"
				audio={audio}
				clickSound="close"
				nav-auto={1}>
				{strings.close}
			</Button>
		</Modal>
	)
}

export default ConfigModal