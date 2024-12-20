import { useState } from "react"
import { settings } from "../utils/settings"
import { useObserver } from "@tsukiweb-common/utils/Observer"
import { ViewRatio } from "@tsukiweb-common/constants"

type Props = {
	children: React.ReactNode
}

const AppLayout = ({ children }: Props) => {
	const [style, setStyle] = useState<Record<string, any>>({
    "--font": settings.font
  })
  const [viewStyle, setViewStyle] = useState<Record<string, any>>({
    "--ratio": settings.fixedRatio == ViewRatio.unconstrained ? "initial" : `${settings.fixedRatio}`,
    "--width": settings.fixedRatio == ViewRatio.unconstrained ? "100%" : "initial"
  })

  useObserver(font => {
    setStyle({...style, '--font': font})
  }, settings, "font")

  useObserver(ratio => {
    if (ratio == ViewRatio.unconstrained) {
      setViewStyle({...viewStyle, '--ratio': "initial", '--width': "100%"})
    } else {
      setViewStyle({...viewStyle, '--ratio': `${ratio}`, '--width': "initial"})
    }
  }, settings, "fixedRatio")

	return (
		<div id="root-view" style={style}>
			<div id="view" style={viewStyle}>
				{children}
			</div>
		</div>
	)
}

export default AppLayout