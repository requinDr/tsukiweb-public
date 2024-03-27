import ReactModal from "react-modal";
import styles from '../styles/modal.module.scss';

type Props = {
	show: boolean;
	setShow: (show: boolean) => void;
	children: React.ReactNode;
	className?: string;
};
const Modal = ({ show, setShow, children, className }: Props) => {

	return (
		<ReactModal
			isOpen={show}
			shouldCloseOnOverlayClick={true}
			onRequestClose={()=>setShow(false)}
			closeTimeoutMS={200}
			className={`${styles.modal} modal ${className}`}
			overlayClassName={`${styles.overlay} overlay`}
			ariaHideApp={false}
		>
			{children}
		</ReactModal>
	)
}

export default Modal