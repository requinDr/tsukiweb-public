import styles from "../styles/layouts.module.scss"

type Props = {
	children: any
}
const PageSection = ({children}: Props) => {
	return (
		<section className={styles.pageSection}>
			{children}
		</section>
	)
}

export default PageSection