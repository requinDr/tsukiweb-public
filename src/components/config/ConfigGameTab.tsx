import { ConfigButtons, ConfigItem, ConfigRange, ResetButton } from "./ConfigLayout"
import { getLocale, strings } from "../../translation/lang"
import { useLanguageRefresh } from "../../hooks/useLanguageRefresh"
import { useConfig } from "../../hooks"
import { PageSection } from "@tsukiweb-common/ui-core"
import { fullscreen } from "@tsukiweb-common/utils/utils"
import { ViewRatio, TEXT_SPEED } from "@tsukiweb-common/constants"
import { useIsFullscreen } from "@tsukiweb-common/hooks"

const MAX_DELAY = 3000
const DELAY_STEP = 100

const ConfigGameTab = () => {
	useLanguageRefresh()
	const { conf, update, reset } = useConfig([
		'textSpeed', 'fixedRatio', 'autoClickDelay', 'nextPageDelay'] as const)
	const isFullscreen = useIsFullscreen()
	
	const msToS = (ms: number)=>
		(ms / 1000).toLocaleString(getLocale(), { maximumSignificantDigits: 3 })

	const adjustDelay = (key: 'autoClickDelay' | 'nextPageDelay', delta: number) => {
		const newVal = Math.max(0, Math.min(MAX_DELAY, conf[key] + delta))
		update(key, newVal)
	}

	return (
		<PageSection>
			<ConfigItem label={strings.config.ratio}>
				<ConfigButtons
					currentValue={conf.fixedRatio}
					onChange={v => update('fixedRatio', v)}
					btns={[
						{ label: strings.config["ratio-auto"], value: ViewRatio.unconstrained },
						{ label: strings.config["ratio-4-3"], value: ViewRatio.fourByThree },
						{ label: strings.config["ratio-16-9"], value: ViewRatio.sixteenByNine }
					]}
				/>
			</ConfigItem>

			<ConfigItem label={strings.config.fullscreen}>
				<ConfigButtons
					currentValue={isFullscreen}
					onChange={v => v ? fullscreen.setOn() : fullscreen.setOff()}
					btns={[
						{ label: strings.config.on, value: true },
						{ label: strings.config.off, value: false },
					]}
					disabled={!fullscreen.isSupported}
				/>
			</ConfigItem>

			<ConfigItem label={strings.config["text-speed"]}>
				<ConfigButtons
					currentValue={conf.textSpeed}
					onChange={v => update('textSpeed', v)}
					btns={[
						{ label: strings.config["text-speed-low"], value: TEXT_SPEED.slow },
						{ label: strings.config["text-speed-med"], value: TEXT_SPEED.normal },
						{ label: strings.config["text-speed-high"], value: TEXT_SPEED.fast },
						{ label: strings.config["text-speed-instant"], value: TEXT_SPEED.instant }
					]}
				/>
			</ConfigItem>

			<ConfigItem label={strings.config["auto-play-delay-text"].replace('%0',msToS(conf.autoClickDelay))}>
				<ConfigRange
					min={0}
					max={MAX_DELAY}
					step={DELAY_STEP}
					value={conf.autoClickDelay}
					onDecrement={() => adjustDelay('autoClickDelay', -DELAY_STEP)}
					onIncrement={() => adjustDelay('autoClickDelay', DELAY_STEP)}
					onChange={e => update('autoClickDelay', parseInt(e.target.value))}
				/>
			</ConfigItem>

			<ConfigItem label={strings.config["auto-play-delay-page"].replace('%0',msToS(conf.nextPageDelay))}>
				<ConfigRange
					min={0}
					max={MAX_DELAY}
					step={DELAY_STEP}
					value={conf.nextPageDelay}
					onDecrement={() => adjustDelay('nextPageDelay', -DELAY_STEP)}
					onIncrement={() => adjustDelay('nextPageDelay', DELAY_STEP)}
					onChange={e => update('nextPageDelay', parseInt(e.target.value))}
				/>
			</ConfigItem>

			<ResetButton onClick={reset} />
		</PageSection>
	)
}

export default ConfigGameTab