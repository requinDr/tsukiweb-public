import styles from "../styles/layouts.module.scss"

type Props = {
	children: any
	[key: string]: any
}
const PageSection = ({children, ...props}: Props) => {
	return (
		<section
			{...props}
			className={`${styles.pageSection} ${props.className || ''}`}
		>
			{children}
		</section>
	)
}

export default PageSection