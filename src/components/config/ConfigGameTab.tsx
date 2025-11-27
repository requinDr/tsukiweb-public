import { useEffect, useState } from "react"
import { ConfigButtons, ConfigItem, ResetBtn } from "./ConfigLayout"
import { defaultSettings, settings } from "../../utils/settings"
import { FaMinus, FaPlus } from "react-icons/fa"
import { getLocale, strings } from "../../translation/lang"
import { useLanguageRefresh } from "../../hooks/useLanguageRefresh"
import { PageSection } from "@tsukiweb-common/ui-core"
import { deepAssign, fullscreen } from "@tsukiweb-common/utils/utils"
import { ViewRatio, TEXT_SPEED } from "@tsukiweb-common/constants"
import useIsFullscreen from "@tsukiweb-common/hooks/useIsFullscreen"

const ConfigGameTab = () => {
	useLanguageRefresh()
	const [conf, setConf] = useState(deepAssign({
		// object only used for its structure. Values don't matter.
		textSpeed: undefined,
		fixedRatio: undefined,
		autoClickDelay: undefined,
		nextPageDelay: undefined,
	}, settings, {extend: false}))

	const isFullscreen = useIsFullscreen()

	useEffect(()=> {
		deepAssign(settings, conf)
	}, [conf])

	const updateValue = <T extends keyof typeof conf>(
		key: T,
		value: typeof conf[T]
	) => setConf(prev => ({ ...prev, [key]: value }))
	
	const numFormat = new Intl.NumberFormat(getLocale(), { maximumSignificantDigits: 3 })
	const msToS = (ms: number)=> {
		return numFormat.format(ms/1000)
	}

	const handleReset = () => {
		const defaultConf = deepAssign(structuredClone(conf), defaultSettings, {extend: false})
		setConf(defaultConf)
	}

	return (
		<PageSection>
			<ConfigItem label={strings.config.ratio}>
				<ConfigButtons
					currentValue={conf.fixedRatio}
					btns={[
						{ label: strings.config["ratio-auto"], value: ViewRatio.unconstrained },
						{ label: strings.config["ratio-4-3"], value: ViewRatio.fourByThree },
						{ label: strings.config["ratio-16-9"], value: ViewRatio.sixteenByNine }
					]}
					updateValue={newValue => updateValue('fixedRatio', newValue)}
				/>
			</ConfigItem>

			<ConfigItem label={strings.config.fullscreen}>
				<ConfigButtons
					currentValue={isFullscreen}
					btns={[
						{ label: strings.config.on, value: true },
						{ label: strings.config.off, value: false },
					]}
					updateValue={newValue => {
						if (newValue && !isFullscreen) {
							fullscreen.setOn()
						} else if (!newValue && isFullscreen) {
							fullscreen.setOff()
						}
					}}
					disabled={!fullscreen.isSupported}
				/>
			</ConfigItem>

			<ConfigItem label={strings.config["text-speed"]}>
				<ConfigButtons
					currentValue={conf.textSpeed}
					btns={[
						{ label: strings.config["text-speed-low"], value: TEXT_SPEED.slow },
						{ label: strings.config["text-speed-med"], value: TEXT_SPEED.normal },
						{ label: strings.config["text-speed-high"], value: TEXT_SPEED.fast },
						{ label: strings.config["text-speed-instant"], value: TEXT_SPEED.instant }
					]}
					updateValue={newValue => updateValue('textSpeed', newValue)}
				/>
			</ConfigItem>

			<ConfigItem label={strings.config["auto-play-delay-text"].replace('%0',msToS(conf.autoClickDelay))}>
				<div className="config-range">
					<span className="icon"><FaMinus /></span>
					<input
						type="range"
						min={0}
						max={3000}
						step={100}
						value={conf.autoClickDelay}
						onChange={e => {
							updateValue('autoClickDelay', parseInt(e.target.value))
						}} />
					<span className="icon"><FaPlus /></span>
				</div>
			</ConfigItem>

			<ConfigItem label={strings.config["auto-play-delay-page"].replace('%0',msToS(conf.nextPageDelay))}>
				<div className="config-range">
					<span className="icon"><FaMinus /></span>
					<input
						type="range"
						min={0}
						max={3000}
						step={100}
						value={conf.nextPageDelay}
						onChange={e => {
							updateValue('nextPageDelay', parseInt(e.target.value))
						}} />
					<span className="icon"><FaPlus /></span>
				</div>
			</ConfigItem>

			<ResetBtn onClick={handleReset} />
		</PageSection>
	)
}

export default ConfigGameTab