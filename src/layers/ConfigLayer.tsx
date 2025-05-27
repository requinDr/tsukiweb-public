import { useEffect, useRef } from "react"
import ConfigLayout from "../components/ConfigLayout";
import classNames from "classnames";


type Props = {
	display: boolean
	back: ()=>void
}
const ConfigLayer = ({display, back}: Props) => {
	const rootRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!display && rootRef.current?.contains(document.activeElement))
			(document.activeElement as HTMLElement).blur?.()
	}, [display])
	
	return (
		<div
			id="layer-config"
			className={classNames("layer", {show: display})}
			ref={rootRef}>
			<ConfigLayout back={back} />
		</div>
	)
}

export default ConfigLayer
