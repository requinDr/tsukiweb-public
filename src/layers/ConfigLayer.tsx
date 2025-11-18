import { memo, useEffect, useRef, useState } from "react"
import ConfigLayout, { ConfigTabs } from "../components/config/ConfigLayout";
import classNames from "classnames";


type Props = {
	display: boolean
	back: ()=>void
}
const ConfigLayer = ({display, back}: Props) => {
	const [activeTab, setActiveTab] = useState(ConfigTabs.game)
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
			<ConfigLayout
				back={back}
				selectedTab={activeTab}
				setSelectedTab={setActiveTab}
			/>
		</div>
	)
}

export default memo(ConfigLayer)
