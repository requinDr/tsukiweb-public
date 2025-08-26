import { ReactNode, useEffect, useState } from "react"
import { ConfigButtons, ConfigItem, ResetBtn } from "./ConfigLayout"
import { defaultSettings, settings } from "../../utils/settings"
import { strings } from "../../translation/lang"
import { MdOutlineVolumeOff, MdOutlineVolumeUp, MdVolumeMute } from "react-icons/md"
import { useLanguageRefresh } from "../../hooks/useLanguageRefresh"
import { PageSection } from "@tsukiweb-common/ui-core"
import { deepAssign, negative } from "@tsukiweb-common/utils/utils"
import ConfigModal from "./ConfigModal"
import { bb } from "@tsukiweb-common/utils/Bbcode"

const ConfigAudioTab = () => {
	useLanguageRefresh()
	const [conf, setConf] = useState(deepAssign({
		volume: undefined,
		trackSource: undefined,
		autoMute: undefined
	}, settings, {extend: false}))
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
		const newConf = structuredClone(prev)
		newConf[key1][key2] = value
		return newConf
	})

	const volumeNames: Partial<Record<keyof typeof conf.volume, string>> = {
		'master': strings.config["volume-master"],
		'track': strings.config["volume-track"],
		'se': strings.config["volume-se"],
		'titleTrack': strings.config["volume-title-track"],
		// 'systemSE': strings.config["volume-system-se"]
	}

	const handleReset = () => {
		const defaultConf = deepAssign(structuredClone(conf), defaultSettings, {extend: false})
		setConf(defaultConf)
	}

	return (
		<PageSection>
			{(Object.keys(volumeNames) as Array<keyof typeof volumeNames>).map(key=>
				<ConfigItem key={key} title={volumeNames[key]}>
					<div className="config-range">
						<span className="icon"><MdVolumeMute /></span>
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
						<button className="icon mute"
							onClick={()=> updateSubValue('volume', key, -conf.volume[key])}>
							{negative(conf.volume[key]) ? <MdOutlineVolumeOff aria-label="mute" className="off" /> : <MdOutlineVolumeUp aria-label="unmute" />}
						</button>
					</div>
				</ConfigItem>
			)}
			
			<ConfigButtons
				title={strings.config["track-source"]}
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
				btns={Object.entries(strings.audio["track-sources"]).map(
					([id, {name}])=> ({text: name, value: id}))}
				property="trackSource"
				conf={conf}
				updateValue={updateValue}
			/>

			<ConfigButtons
				title={strings.config['auto-mute']}
				btns={[
					{ text: strings.config.on, value: true },
					{ text: strings.config.off, value: false },
				]}
				property="autoMute"
				conf={conf}
				updateValue={updateValue}
			/>

			<ResetBtn onClick={handleReset} />

			<ConfigModal modal={modal} setModal={setModal} />
		</PageSection>
	)
}

export default ConfigAudioTab