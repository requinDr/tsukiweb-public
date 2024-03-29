import { Link } from "react-router-dom"
import styles from "../styles/button.module.scss"

interface PropsButton {
	onClick: ()=>void
}
interface PropsLink {
	to: string
}

type Props = {
	children: any
	className?: string
	[key: string]: any
} & (PropsButton | PropsLink)

/**
 * A button or Link already styled
 */
const MenuButton = ({children, onClick, to, className, ...props}: Props) => {
	const button = onClick ? (
		<button
			onClick={onClick}
			className={`${styles.menuBtn} menu-btn ${className || ""}`}
			{...props}>
			{children}
		</button>
	) : (
		<Link
			to={to}
			className={`${styles.menuBtn} menu-btn ${className || ""}`}
			{...props}>
			{children}
		</Link>
	)
	return button
}

export default MenuButton