import { useEffect, useState } from "react"
import { ConfigButtons, ConfigItem, ResetBtn } from "./ConfigLayout"
import { settings } from "../../utils/settings"
import { getLocale, strings } from "../../translation/lang"
import { useLanguageRefresh } from "../../hooks/useLanguageRefresh"
import { PageSection } from "@tsukiweb-common/ui-core"
import { deepAssign, extract, fullscreen } from "@tsukiweb-common/utils/utils"
import { ViewRatio, TEXT_SPEED } from "@tsukiweb-common/constants"
import useIsFullscreen from "@tsukiweb-common/hooks/useIsFullscreen"
import { HiMinus, HiPlus } from "react-icons/hi"

const MAX_DELAY = 3000
const DELAY_STEP = 100

const ConfigGameTab = () => {
	useLanguageRefresh()
	const [conf, setConf] = useState(extract(settings, [
		'textSpeed', 'fixedRatio', 'autoClickDelay', 'nextPageDelay']))

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

	const adjustDelay = (key: 'autoClickDelay' | 'nextPageDelay', delta: number) => {
		const newVal = Math.max(0, Math.min(MAX_DELAY, conf[key] + delta))
		updateValue(key, newVal)
	}

	const handleReset = () => {
		const defaultConf = deepAssign(conf, settings.getReference()!, {extend: false, clone: true})
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
					<button className="icon btn" onClick={() => adjustDelay('autoClickDelay', -DELAY_STEP)} nav-auto={1}>
						<HiMinus />
					</button>
					<input
						type="range"
						min={0}
						max={MAX_DELAY}
						step={DELAY_STEP}
						value={conf.autoClickDelay}
						onChange={e => {
							updateValue('autoClickDelay', parseInt(e.target.value))
						}} />
					<button className="icon btn" onClick={() => adjustDelay('autoClickDelay', DELAY_STEP)} nav-auto={1}>
						<HiPlus />
					</button>
				</div>
			</ConfigItem>

			<ConfigItem label={strings.config["auto-play-delay-page"].replace('%0',msToS(conf.nextPageDelay))}>
				<div className="config-range">
					<button className="icon btn" onClick={() => adjustDelay('nextPageDelay', -DELAY_STEP)} nav-auto={1}>
						<HiMinus />
					</button>
					<input
						type="range"
						min={0}
						max={MAX_DELAY}
						step={DELAY_STEP}
						value={conf.nextPageDelay}
						onChange={e => {
							updateValue('nextPageDelay', parseInt(e.target.value))
						}} />
					<button className="icon btn" onClick={() => adjustDelay('nextPageDelay', DELAY_STEP)} nav-auto={1}>
						<HiPlus />
					</button>
				</div>
			</ConfigItem>

			<ResetBtn onClick={handleReset} />
		</PageSection>
	)
}

export default ConfigGameTab