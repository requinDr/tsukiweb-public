import { ReactNode, useState } from "react"
import { MdDeleteForever, MdDownload, MdFileUpload } from "react-icons/md"
import { Button, PageSection } from "@tsukiweb-common/ui-core"
import { bb } from "@tsukiweb-common/utils/Bbcode"
import { dialog } from "@tsukiweb-common/ui-core/components/ModalPrompt"
import { polyfillCountryFlagEmojis } from "@tsukiweb-common/utils/flagsPolyfill"
import { imageSrc } from "translation/assets"
import { useConfig } from "@tsukiweb-common/hooks/useConfig";
import { exportGameData, importGameData, settings } from "engine/settings";
import { strings } from "translation/lang";
import { savesManager } from "engine/savestates";
import { ConfigButtons, ConfigItem, ResetButton } from "../ConfigLayout";
import ConfigModal from "../ConfigModal";
import FontSelector from "../FontSelector";
import { useLanguageRefresh } from "app/hooks";
import { FULLSAVE_EXT } from "app/utils/constants";

let flagSupportChecked = false

const ConfigAdvancedTab = () => {
	useLanguageRefresh()
	const [modal, setModal] = useState<{show: boolean, content: ReactNode}>({show: false, content: undefined})

	const { conf, update, reset } = useConfig(settings,
		['eroBlur', 'eroSkip', 'unlockEverything', 'gameFont', 'flowchartBadges', 'forceAudioBuffer'])

	if (!flagSupportChecked) {
		polyfillCountryFlagEmojis()
		flagSupportChecked = true
	}

	const exportData = () => {
		exportGameData()
	}

	const importData = (allExtensions=false) => {
		importGameData(allExtensions ? '*' : `.${FULLSAVE_EXT}`)
	}

	const eraseData = async () => {
		const confirmed = await dialog.confirm({
			text: strings.config["data-erase-warning"],
			labelYes: strings.yes,
			labelNo: strings.no,
			color: "#ab0000"
		})
		if (confirmed) {
			savesManager.clear()
			setTimeout(async ()=> {
				localStorage.clear()
				await dialog.alert({
					text: strings.config["data-erase-confirm"],
					labelOk: strings.ok,
				})
			}, 10) // leave room for asynchronous callbacks (if any) to complete
		}
	}

	const handleSetWarning = (value: boolean) => {
		if (value) {
			update('eroBlur', true)
		}
		update('eroSkip', value ? 'ask' : 'no')
	}

	return (
		<PageSection>
			<div className="sub">
				<div className="title">{strings.config["adult-title"]}</div>
				<ConfigItem
					label={strings.config["adult-warn"]}
				>
					<ConfigButtons
						currentValue={conf.eroSkip != 'no'}
						onChange={handleSetWarning}
						btns={[
							{ label: strings.config.on, value: true },
							{ label: strings.config.off, value: false },
						]}
					/>
				</ConfigItem>
				<ConfigItem
					label={strings.config["adult-blur"]}
					helpAction={()=>setModal({show: true, content:
						<>
							<h2>{strings.config["adult-blur"]}</h2>
							{strings.config["adult-blur-help"].map((txt, i) =>
								<div key={i}>{bb(txt)}</div>
							)}

							<div className="comparison">
								<div className="comparison-container">
									<img
										className="unblurred"
										src={imageSrc("event/ark_e01", 'src')}
										alt="Sample image, unblurred"
										draggable={false}
									/>
								</div>
								<div className="comparison-container">
									<img
										className="blurred"
										src={imageSrc("event/ark_e01", 'src')}
										alt="Sample image, blurred"
										draggable={false}
									/>
								</div>
							</div>
						</>
					})}
				>
					<ConfigButtons
						currentValue={conf.eroBlur}
						onChange={v => update('eroBlur', v)}
						btns={[
							{ label: strings.config.on, value: true },
							{ label: strings.config.off, value: false },
						]}
					/>
				</ConfigItem>
			</div>

			<ConfigItem
				label={strings.config["game-font"]}
				helpAction={()=>setModal({show: true, content:
					<>
						<h2>{strings.config["game-font"]}</h2>
						{strings.config["game-font-help"].map((txt, i) =>
							<p key={i}>{bb(txt.replace('%0', `[url='https://fonts.google.com/']Google Fonts[/url]`))}</p>
						)}
					</>
				})}>
				<FontSelector
					value={conf.gameFont}
					onChange={v => update('gameFont', v)}
				/>
			</ConfigItem>

			<ConfigItem
				label={strings.config["flowchart-badges"]}
			>
				<ConfigButtons
					currentValue={conf.flowchartBadges}
					onChange={v => update('flowchartBadges', v)}
					btns={[
						{ label: strings.config.on, value: true },
						{ label: strings.config.off, value: false },
					]}
				/>
			</ConfigItem>

			<ConfigItem
				label={strings.config["show-locked-content"]}
				helpAction={()=>setModal({show: true, content:
					<>
						<h2>{strings.config["show-locked-content"]}</h2>
						{strings.config["show-locked-content-help"].map((txt, i) =>
							<p key={i}>{bb(txt)}</p>
						)}
					</>
				})}>
				<ConfigButtons
					currentValue={conf.unlockEverything}
					onChange={v => update('unlockEverything', v)}
					btns={[
						{ label: strings.yes, value: true },
						{ label: strings.no, value: false },
					]}
				/>
			</ConfigItem>

			<ConfigItem label={strings.config.data}>
				<div className="config-btns">
					<Button className="config-btn"
						onClick={importData.bind(null, false)}
						onContextMenu={importData.bind(null, true)}
						nav-auto={1}>
						<MdFileUpload aria-hidden /> {strings.config["data-import"]}
					</Button>
					<Button className="config-btn"
						onClick={exportData}
						nav-auto={1}>
						<MdDownload aria-hidden /> {strings.config["data-export"]}
					</Button>
					<Button className="config-btn erase"
						onClick={eraseData}
						nav-auto={1}>
						<MdDeleteForever aria-hidden /> {strings.config["data-erase"]}
					</Button>
				</div>
			</ConfigItem>

			<ConfigItem
				label={"Force the use of Web Audio API for tracks"}
			>
				<ConfigButtons
					currentValue={conf.forceAudioBuffer}
					onChange={v => update('forceAudioBuffer', v)}
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

export default ConfigAdvancedTab