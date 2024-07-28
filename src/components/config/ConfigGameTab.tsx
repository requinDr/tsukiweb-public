import { useEffect, useState } from "react"
import { ConfigButtons, ConfigItem, ResetBtn } from "../ConfigLayout"
import { defaultSettings, settings } from "../../utils/settings"
import { FaMinus, FaPlus } from "react-icons/fa"
import { getLocale, strings } from "../../translation/lang"
import { useLanguageRefresh } from "../hooks/useLanguageRefresh"
import PageSection from "@tsukiweb-common/ui-core/layouts/PageSection"
import { deepAssign, isFullscreen, toggleFullscreen, addEventListener } from "@tsukiweb-common/utils/utils"
import { TEXT_SPEED_MAX, TEXT_SPEED_STEP_WIDTH, TextSettingsToCharacterDelay, ViewRatio } from "@tsukiweb-common/constants"

const ConfigGameTab = () => {
	useLanguageRefresh()
	const [conf, setConf] = useState(deepAssign({
		// object only used for its structure. Values don't matter.
		textSpeed: undefined,
		fixedRatio: undefined,
		autoClickDelay: undefined,
		nextPageDelay: undefined,
	}, settings, {extend: false}))

	const [fullscreen, setFullscreen] = useState<boolean>(isFullscreen()) // don't save in settings

	useEffect(()=> {
		deepAssign(settings, conf)
	}, [conf])

	useEffect(()=> {
		return addEventListener({event: 'fullscreenchange', handler: ()=> {
			setFullscreen(isFullscreen())
		}})
	}, [])

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
			<ConfigButtons
				title={strings.config.ratio}
				btns={[
					{ text: strings.config["ratio-auto"], value: ViewRatio.unconstrained },
					{ text: strings.config["ratio-4-3"], value: ViewRatio.fourByThree },
					{ text: strings.config["ratio-16-9"], value: ViewRatio.sixteenByNine }
				]}
				property="fixedRatio"
				conf={conf}
				updateValue={updateValue}
			/>

			<ConfigButtons
				title={strings.config.fullscreen}
				btns={[
					{ text: strings.config.on, value: true },
					{ text: strings.config.off, value: false },
				]}
				property="fullscreen"
				conf={{fullscreen}}
				updateValue={toggleFullscreen}
			/>

			<ConfigItem title={strings.config["text-speed"]}>
				<div className="config-range">
					<span className="icon"><FaMinus /></span>
					<input
						type="range"
						min={0}
						max={TEXT_SPEED_MAX}
						step={TEXT_SPEED_STEP_WIDTH}
						value={conf.textSpeed}
						onChange={e => {
							updateValue('textSpeed', TextSettingsToCharacterDelay(parseInt(e.target.value)))
						}} />
					<span className="icon"><FaPlus /></span>
				</div>
			</ConfigItem>

			<ConfigItem title={strings.config["auto-play-delay-text"].replace('$0',msToS(conf.autoClickDelay))}>
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

			<ConfigItem title={strings.config["auto-play-delay-page"].replace('$0',msToS(conf.nextPageDelay))}>
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