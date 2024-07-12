import { Link, LinkProps } from "react-router-dom"
import styles from "../styles/button.module.scss"

interface PropsButton extends React.ButtonHTMLAttributes<HTMLButtonElement> {
}
interface PropsLink extends LinkProps {
	to: string
}

type Props = {
	variant?: "default" | "corner"
	active?: boolean
	className?: string
	[key: string]: any
} & (PropsButton | PropsLink)

/**
 * A button or Link already styled
 */
const Button = ({children, to, className, variant = "default", active = false, ...props}: Props) => {
	const classNames = [styles.btn, "btn"]
	if (variant === "default") {
		classNames.push(styles.btnVariantDefault)
	} else if (variant === "corner") {
		classNames.push(styles.btnVariantCorner)
	}
	if (active) {
		classNames.push(styles.active)
	}
	if (className) {
		classNames.push(className)
	}

	const button = to ? (
		<Link
			className={classNames.join(" ") || ""}
			{...props as LinkProps}
		>
			{children}
		</Link>
	) : (
		<button
			// onClick={onClick}
			className={classNames.join(" ") || ""}
			{...props as React.ButtonHTMLAttributes<HTMLButtonElement>}
		>
			{children}
		</button>
	)
	return button
}

export default Button