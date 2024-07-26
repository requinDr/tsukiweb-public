import { useEffect, useRef } from "react"
import { displayMode } from "../utils/display"
import ConfigLayout from "../components/ConfigLayout";
import { useObserved } from "@tsukiweb-common/utils/Observer";
import classNames from "classnames";


type Props = {
	back: ()=>void
}
const ConfigLayer = ({back}: Props) => {
	const [display] = useObserved(displayMode, 'config')
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
