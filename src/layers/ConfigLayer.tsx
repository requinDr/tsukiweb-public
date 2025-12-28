import { memo, useEffect, useRef, useState } from "react"
import ConfigLayout, { ConfigTabs } from "../components/config/ConfigLayout";
import { AnimatedHideActivityDiv } from "@tsukiweb-common/ui-core/components/AnimatedHideActivityDiv"


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
		<AnimatedHideActivityDiv
			show={display}
			showProps={{className: 'show'}}
			id="layer-config"
			className="layer"
			ref={rootRef}>
			<ConfigLayout
				back={back}
				selectedTab={activeTab}
				setSelectedTab={setActiveTab}
			/>
		</AnimatedHideActivityDiv>
	)
}

export default memo(ConfigLayer)
