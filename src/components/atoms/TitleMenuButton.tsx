import { useMemo } from "react";
import { Link } from "react-router-dom";

type Props = {
	[key: string]: any;
	children: React.ReactNode;
}

const TitleMenuButton = ({
	onClick,
	to,
	attention,
	children,
	...props
}: Props) => {
	const Attention = () => <span> !</span>

	const className = useMemo(()=>
		["menu-item", attention ? "attention" : "", props.className ?? ""]
			.filter(Boolean).join(" "),
		[attention, props.className]
	)

	if (to) {
		return (
			<Link {...props} to={to} className={className} >
				{children}
				{attention && <Attention />}
			</Link>
		)
	} else {
		return (
			<button {...props} className={className} onClick={onClick}>
				{children}
				{attention && <Attention />}
			</button>
		)
	}
}

export default TitleMenuButton