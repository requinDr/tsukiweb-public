import { Button, PageSection } from "@tsukiweb/common/ui-core"
import { fullscreen } from "@tsukiweb/common/utils/utils"
import { ViewRatio, TEXT_SPEEDS } from "@tsukiweb/common/constants"
import { useIsFullscreen } from "@tsukiweb/common/hooks"
import { useConfig } from "@tsukiweb/common/hooks/useConfig";
import { getLocale, languages, strings, useStrings } from "translation/lang";
import { ConfigButtons, ConfigItem, ConfigRange, ResetButton } from "../ConfigControls";
import ModalLanguageSelection from "../ModalLanguageSelection";
import { useMemo, useState } from "react";
import { settings } from "engine/settings";
import { BBTypeWriter } from "@tsukiweb/common/utils/Bbcode";

const MAX_DELAY = 3000
const DELAY_STEP = 100

const ConfigGameTab = () => {
	const [showLanguage, setShowLanguage] = useState<boolean>(false)
	const strings = useStrings()
	const { conf, update, reset } = useConfig(settings,
		['textSpeed', 'fixedRatio', 'autoClickDelay', 'nextPageDelay'])
	const isFullscreen = useIsFullscreen()
	
	const msToS = (ms: number)=>
		(ms / 1000).toLocaleString(getLocale(), { maximumSignificantDigits: 3 })

	const adjustDelay = (key: 'autoClickDelay' | 'nextPageDelay', delta: number) => {
		const newVal = Math.max(0, Math.min(MAX_DELAY, conf[key] + delta))
		update(key, newVal)
	}
	const adjustTextSpeed = (delta: number)=> {
		const i = textSpeedIndex + delta
		update("textSpeed", TEXT_SPEEDS[i])
	}
	const textSpeedIndex = useMemo(()=>{
		let i = TEXT_SPEEDS.indexOf(conf.textSpeed)
		if (i >= 0)
			return i
		let minDelta = Math.abs(TEXT_SPEEDS[0]-conf.textSpeed)
		let bestI = 0
		for (let i=1; i < TEXT_SPEEDS.length; i++) {
			const delta = Math.abs(TEXT_SPEEDS[i] - conf.textSpeed)
			if (delta < minDelta)
				bestI = i;
		}
		return bestI;
	}, [conf.textSpeed])

	return (
		<PageSection>
			<ConfigItem label={strings.config.language}>
				<Button
					nav-auto={1}
					className="config-btn flag"
					onClick={()=>setShowLanguage(true)}>
					{languages?.[settings.language]?.["display-name"]} +{Object.keys(languages).length - 1}
				</Button>
				<ModalLanguageSelection show={showLanguage} setShow={setShowLanguage} />
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

			<ConfigItem label={strings.config["text-speed"].replace('%0',conf.textSpeed.toString())}>
				<ConfigRange
					min={0}
					max={TEXT_SPEEDS.length-1}
					step={1}
					value={textSpeedIndex}
					onDecrement={() => adjustTextSpeed(-1)}
					onIncrement={() => adjustTextSpeed(+1)}
					onChange={e => update('textSpeed', TEXT_SPEEDS[parseInt(e.target.value)])}
				/>
				<div className="text-speed-preview">
					<span className="placeholder" aria-hidden>{strings.config["text-speed-test"]}</span>
					<span>
						<BBTypeWriter key={conf.textSpeed} text={strings.config["text-speed-test"]} charDelay={conf.textSpeed}/>
					</span>
				</div>
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