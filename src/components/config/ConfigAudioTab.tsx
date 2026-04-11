import { ReactNode, useState } from "react"
import { ConfigButtons, ConfigIconButton, ConfigItem, ConfigRange, ResetButton } from "./ConfigLayout"
import { strings } from "../../translation/lang"
import { MdOutlineVolumeOff, MdOutlineVolumeUp } from "react-icons/md"
import { useLanguageRefresh } from "../../hooks/useLanguageRefresh"
import { useConfig } from "../../hooks"
import { PageSection } from "@tsukiweb-common/ui-core"
import { negative } from "@tsukiweb-common/utils/utils"
import ConfigModal from "./ConfigModal"
import { bb } from "@tsukiweb-common/utils/Bbcode"

const ConfigAudioTab = () => {
	useLanguageRefresh()
	const { conf, update, reset } = useConfig(['volume', 'trackSource', 'autoMute'] as const)
	const [modal, setModal] = useState<{show: boolean, content: ReactNode}>({show: false, content: undefined})
	type VolumeKey = Extract<keyof typeof conf.volume, string>

	const volumeNames: Partial<Record<VolumeKey, string>> = {
		'master': strings.config["volume-master"],
		'track': strings.config["volume-track"],
		'se': strings.config["volume-se"],
		'titleTrack': strings.config["volume-title-track"],
		'systemSE': strings.config["volume-system-se"]
	}

	const updateVol = (key: VolumeKey, val: number) => {
		const nextVol = { ...conf.volume, [key]: val }
		update('volume', nextVol)
	}

	const adjustVolume = (key: VolumeKey, newAbs: number) => {
		const sign = Math.sign(conf.volume[key]) || 1
		const clampedAbs = Math.max(0, Math.min(10, newAbs))

		updateVol(key, sign * clampedAbs)
	}

	return (
		<PageSection>
			{(Object.keys(volumeNames) as VolumeKey[]).map(key=>
				<ConfigItem key={key} label={volumeNames[key]}>
					<ConfigRange
						min={0}
						max={10}
						step={1}
						value={Math.abs(conf.volume[key])}
						onDecrement={() => adjustVolume(key, Math.abs(conf.volume[key]) - 1)}
						onIncrement={() => adjustVolume(key, Math.abs(conf.volume[key]) + 1)}
						onChange={e => adjustVolume(key, parseInt(e.target.value))}
					>
						<ConfigIconButton
							onClick={()=> updateVol(key, -conf.volume[key])}
							icon={negative(conf.volume[key])
								? <MdOutlineVolumeOff aria-label="mute" className="off" />
								: <MdOutlineVolumeUp aria-label="unmute" />
							}
						>
						</ConfigIconButton>
					</ConfigRange>
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
					onChange={v => update('trackSource', v)}
					btns={Object.entries(strings.config["track-sources"]).map(
						([id, name])=> ({label: name, value: id as typeof conf.trackSource}))}
				/>
			</ConfigItem>

			<ConfigItem label={strings.config['auto-mute']}>
				<ConfigButtons
					currentValue={conf.autoMute}
					onChange={v => update('autoMute', v)}
					btns={[
						{ label: strings.config.on, value: true },
						{ label: strings.config.off, value: false },
					]}
				/>
			</ConfigItem>

			<ResetButton onClick={reset} />

			<ConfigModal modal={modal} setModal={setModal} />
		</PageSection>
	)
}

export default ConfigAudioTab