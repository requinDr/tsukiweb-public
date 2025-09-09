import { ReactNode, useEffect, useState } from "react"
import { ConfigButtons, ConfigItem, ResetBtn } from "./ConfigLayout"
import { defaultSettings, exportGameData, importGameData, settings } from "../../utils/settings"
import { savesManager } from "../../utils/savestates"
import { strings, languages } from "../../translation/lang"
import { useLanguageRefresh } from "../../hooks/useLanguageRefresh"
import { MdDeleteForever, MdDownload, MdFileUpload } from "react-icons/md"
import ModalLanguageSelection from "./ModalLanguageSelection"
import ConfigModal from "./ConfigModal"
import { Button, PageSection } from "@tsukiweb-common/ui-core"
import { deepAssign } from "@tsukiweb-common/utils/utils"
import { bb } from "@tsukiweb-common/utils/Bbcode"
import { modalPromptService } from "@tsukiweb-common/ui-core/components/ModalPrompt"
import { polyfillCountryFlagEmojis } from "@tsukiweb-common/utils/flagsPolyfill"
import { avif } from "@tsukiweb-common/utils/images"
import { imageSrc } from "translation/assets"
import { FULLSAVE_EXT } from "utils/constants"
import { warnHScene } from "utils/window-actions"

let flagSupportChecked = false

const ConfigAdvancedTab = () => {
	const [showLanguage, setShowLanguage] = useState<boolean>(false)
	const [modal, setModal] = useState<{show: boolean, content: ReactNode}>({show: false, content: undefined})

	const [conf, setConf] = useState(deepAssign({
		resolution: undefined,
		imagesFolder: undefined,
		language: undefined,
		blurThumbnails: undefined,
		warnHScenes: undefined,
		unlockEverything: undefined,
	}, settings, {extend: false}))  
	useLanguageRefresh()

	useEffect(()=> {
		deepAssign(settings, conf)
	}, [conf])

	if (!flagSupportChecked) {
		polyfillCountryFlagEmojis()
		flagSupportChecked = true
	}

	const updateValue = <T extends keyof typeof conf>(
		key: T,
		value: typeof conf[T]
	) => setConf(prev => ({ ...prev, [key]: value }))

	const exportData = () => {
		exportGameData()
	}

	const importData = (allExtensions=false) => {
		importGameData(allExtensions ? '*' : `.${FULLSAVE_EXT}`)
	}

	const eraseData = async () => {
		const confirmed = await modalPromptService.confirm({
			text: strings.config["data-erase-warning"],
			labelYes: strings.yes,
			labelNo: strings.no,
			color: "#931414"
		})
		if (confirmed) {
			savesManager.clear()
			deepAssign(settings, defaultSettings)
			setTimeout(async ()=> {
				localStorage.clear()
				await modalPromptService.alert({
					text: strings.config["data-erase-confirm"],
					labelOk: strings.ok,
				})
			}, 10) // leave room for asynchronous callbacks (if any) to complete
		}
	}

	const handleReset = () => {
		const defaultConf = deepAssign(structuredClone(conf), defaultSettings, {extend: false})
		setConf(defaultConf)
	}

	return (
		<PageSection>
			<ConfigButtons
				title={strings.config.quality}
				btns={[
					{ text: strings.config["quality-sd"], value: 'sd' },
					{ text: strings.config["quality-hd"], value: 'hd' },
				]}
				property="resolution"
				conf={conf}
				updateValue={updateValue}
			/>

			<ConfigItem title={strings.config.language}>
				<div className="config-btns">
					<Button
						className={`config-btn flag`}
						onClick={()=>setShowLanguage(true)}>
						{languages?.[settings.language]?.["display-name"]}, ...
					</Button>
				</div>
			</ConfigItem>
			<ModalLanguageSelection show={showLanguage} setShow={setShowLanguage} />

			<div className="sub">
				<div className="title">{strings.config["adult-title"]}</div>
				<ConfigButtons
					title={strings.config["adult-blur"]}
					helpAction={()=>setModal({show: true, content:
						<>
							<h2>{strings.config["adult-blur"]}</h2>
							{strings.config["adult-blur-help"].map((txt, i) =>
								<div key={i}>{bb(txt)}</div>
							)}

							<div className="comparison">
								<picture>
									<source srcSet={avif.replaceExtension(imageSrc(`event/ark_e01`, 'sd'))} type="image/avif"/>
									<img
									 	className="unblurred"
									 	src={imageSrc(`event/ark_e01`, 'sd')}
									 	alt={"Sample image, unblurred"}
									 	draggable={false}
									/>
								</picture>
								<picture>
									<source srcSet={avif.replaceExtension(imageSrc(`event/ark_e01`, 'sd'))} type="image/avif"/>
									<img
									 	className="blurred"
									 	src={imageSrc(`event/ark_e01`, 'sd')}
									 	alt={"Sample image, blurred"}
									 	draggable={false}
									/>
								</picture>
							</div>
						</>
					})}
					btns={[
						{ text: strings.config.on, value: true },
						{ text: strings.config.off, value: false },
					]}
					property="blurThumbnails"
					conf={conf}
					updateValue={updateValue}
				/>

				<ConfigButtons
					title={strings.config["adult-warn"]}
					helpAction={() => warnHScene()}
					btns={[
						{ text: strings.config.on, value: true },
						{ text: strings.config.off, value: false },
					]}
					property="warnHScenes"
					conf={conf}
					updateValue={updateValue}
				/>
			</div>

			<ConfigButtons
				title={strings.config["show-locked-content"]}
				helpAction={()=>setModal({show: true, content:
					<>
						<h2>{strings.config["show-locked-content"]}</h2>
						{strings.config["show-locked-content-help"].map((txt, i) =>
							<p key={i}>{bb(txt)}</p>
						)}
					</>
				})}
				btns={[
					{ text: strings.yes, value: true },
					{ text: strings.no, value: false },
				]}
				property="unlockEverything"
				conf={conf}
				updateValue={updateValue}
			/>

			<ConfigItem title={strings.config.data}>
				<div className="config-btns">
					<Button className="config-btn"
						onClick={exportData}>
						<MdDownload /> {strings.config["data-export"]}
					</Button>
					<Button className="config-btn"
						onClick={importData.bind(null, false)}
						onContextMenu={importData.bind(null, true)}>
						<MdFileUpload /> {strings.config["data-import"]}
					</Button>
					<Button className="config-btn erase"
						onClick={eraseData}>
						<MdDeleteForever /> {strings.config["data-erase"]}
					</Button>
				</div>
			</ConfigItem>

			<ResetBtn onClick={handleReset} />

			<ConfigModal modal={modal} setModal={setModal} />
		</PageSection>
	)
}

export default ConfigAdvancedTab