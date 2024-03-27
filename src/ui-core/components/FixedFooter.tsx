import styles from '../styles/fixedfooter.module.scss';

type Props = {
	children?: React.ReactNode
}
const FixedFooter = ({ children }: Props) => {
	return (
		<footer className={styles.footer}>
			<div className={styles.footerContent}>
				{children}
			</div>
		</footer>
	)
}

export default FixedFooter