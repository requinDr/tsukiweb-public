import { ReactNode, useEffect, useState } from "react"
import { ConfigButtons, ConfigItem, ResetBtn } from "./ConfigLayout"
import { settings } from "../../utils/settings"
import { strings } from "../../translation/lang"
import { MdOutlineVolumeOff, MdOutlineVolumeUp } from "react-icons/md"
import { useLanguageRefresh } from "../../hooks/useLanguageRefresh"
import { PageSection } from "@tsukiweb-common/ui-core"
import { deepAssign, extract, negative } from "@tsukiweb-common/utils/utils"
import ConfigModal from "./ConfigModal"
import { bb } from "@tsukiweb-common/utils/Bbcode"
import { HiMinus, HiPlus } from "react-icons/hi"

const ConfigAudioTab = () => {
	useLanguageRefresh()
	const [conf, setConf] = useState(extract(settings,
		['volume', 'trackSource', 'autoMute']))
	const [modal, setModal] = useState<{show: boolean, content: ReactNode}>({show: false, content: undefined})

	useEffect(()=> {
		deepAssign(settings, conf)
	}, [conf])

	const updateValue = <T extends keyof typeof conf>(
		key: T,
		value: typeof conf[T]
	) => setConf(prev => ({ ...prev, [key]: value }))

	const updateSubValue = <K extends keyof typeof conf, T extends keyof (typeof conf)[K]>(
		key1: K,
		key2: T,
		value: typeof conf[K][T]
	) => setConf(prev=> {
		const newConf = deepAssign({}, prev)
		newConf[key1][key2] = value
		return newConf
	})

	const volumeNames: Partial<Record<keyof typeof conf.volume, string>> = {
		'master': strings.config["volume-master"],
		'track': strings.config["volume-track"],
		'se': strings.config["volume-se"],
		'titleTrack': strings.config["volume-title-track"],
		'systemSE': strings.config["volume-system-se"]
	}

	const adjustVolume = (key: keyof typeof conf.volume, delta: number) => {
		const currentVal = conf.volume[key]
		const sign = negative(currentVal) ? -1 : 1
		const absVal = Math.abs(currentVal)
		const newVal = Math.max(0, Math.min(10, absVal + delta))
		updateSubValue('volume', key, sign * newVal)
	}

	const handleReset = () => {
		const defaultConf = deepAssign(conf, settings.getReference()!, {extend: false, clone: true})
		setConf(defaultConf)
	}

	return (
		<PageSection>
			{(Object.keys(volumeNames) as Array<keyof typeof volumeNames>).map(key=>
				<ConfigItem key={key} label={volumeNames[key]}>
					<div className="config-range">
						<button className="icon btn" onClick={() => adjustVolume(key, -1)} nav-auto={1}>
							<HiMinus />
						</button>
						<input
							type="range"
							min={0}
							max={10}
							step={1}
							value={Math.abs(conf.volume[key])}
							onChange={e => {
								const sign = negative(conf.volume[key]) ? -1 : 1
								updateSubValue('volume', key, sign * parseInt(e.target.value))
							}} />
						<button className="icon btn" onClick={() => adjustVolume(key, 1)} nav-auto={1}>
							<HiPlus />
						</button>

						<button className="icon btn"
							onClick={()=> updateSubValue('volume', key, -conf.volume[key])}
							nav-auto={1}>
							{negative(conf.volume[key])
								? <MdOutlineVolumeOff aria-label="mute" className="off" />
								: <MdOutlineVolumeUp aria-label="unmute" />}
						</button>
					</div>
				</ConfigItem>
			)}
			
			<ConfigItem
				label={strings.config["track-source"]}
				helpAction={()=>setModal({show: true, content:
					<>
						<h2>{strings.config["track-source"]}</h2>
						<ul>
						{strings.config["track-source-help"].map((txt, i) =>
							<li key={i}>{bb(txt)}</li>
						)}
						</ul>
					</>
				})}
			>
				<ConfigButtons
					currentValue={conf.trackSource}
					btns={Object.entries(strings.config["track-sources"]).map(
						([id, name])=> ({label: name, value: id as typeof conf.trackSource}))}
					updateValue={newValue => updateValue('trackSource', newValue)}
				/>
			</ConfigItem>

			<ConfigItem label={strings.config['auto-mute']}>
				<ConfigButtons
					currentValue={conf.autoMute}
					btns={[
						{ label: strings.config.on, value: true },
						{ label: strings.config.off, value: false },
					]}
					updateValue={newValue => updateValue('autoMute', newValue)}
				/>
			</ConfigItem>

			<ResetBtn onClick={handleReset} />

			<ConfigModal modal={modal} setModal={setModal} />
		</PageSection>
	)
}

export default ConfigAudioTab