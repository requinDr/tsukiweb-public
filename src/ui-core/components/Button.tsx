import { Link, LinkProps } from "react-router-dom"
import styles from "../styles/button.module.scss"

interface PropsButton extends React.ButtonHTMLAttributes<HTMLButtonElement> {
}
interface PropsLink extends LinkProps {
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
const Button = ({children, to, className, ...props}: Props) => {
	const button = to ? (
		<Link
			// to={to}
			className={`${styles.btn} btn ${className || ""}`}
			{...props as LinkProps}
		>
			{children}
		</Link>
	) : (
		<button
			// onClick={onClick}
			className={`${styles.btn} btn ${className || ""}`}
			{...props as React.ButtonHTMLAttributes<HTMLButtonElement>}
		>
			{children}
		</button>
	)
	return button
}

export default Button