import { ReactNode, useEffect, useState } from "react"
import { ConfigButtons, ConfigItem, ResetBtn } from "./ConfigLayout"
import { exportGameData, importGameData, settings } from "../../utils/settings"
import { savesManager } from "../../utils/savestates"
import { strings, languages } from "../../translation/lang"
import { useLanguageRefresh } from "../../hooks/useLanguageRefresh"
import { MdDeleteForever, MdDownload, MdFileUpload } from "react-icons/md"
import ModalLanguageSelection from "./ModalLanguageSelection"
import ConfigModal from "./ConfigModal"
import { Button, PageSection } from "@tsukiweb-common/ui-core"
import { deepAssign, extract } from "@tsukiweb-common/utils/utils"
import { bb } from "@tsukiweb-common/utils/Bbcode"
import { dialog } from "@tsukiweb-common/ui-core/components/ModalPrompt"
import { polyfillCountryFlagEmojis } from "@tsukiweb-common/utils/flagsPolyfill"
import { imageSrc } from "translation/assets"
import { FULLSAVE_EXT } from "utils/constants"
import { warnHScene } from "utils/window-actions"

let flagSupportChecked = false

const ConfigAdvancedTab = () => {
	useLanguageRefresh()
	const [showLanguage, setShowLanguage] = useState<boolean>(false)
	const [modal, setModal] = useState<{show: boolean, content: ReactNode}>({show: false, content: undefined})

	const [conf, setConf] = useState(extract(settings,
		['language', 'blurThumbnails', 'warnHScenes', 'unlockEverything']))

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
		const confirmed = await dialog.confirm({
			text: strings.config["data-erase-warning"],
			labelYes: strings.yes,
			labelNo: strings.no,
			color: "#931414"
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

	const handleReset = () => {
		const defaultConf = deepAssign(conf, settings.getReference()!, {extend: false, clone: true})
		setConf(defaultConf)
	}

	return (
		<PageSection>
			<div className="sub">
				<div className="title">{strings.config["adult-title"]}</div>
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
						currentValue={conf.blurThumbnails}
						btns={[
							{ label: strings.config.on, value: true },
							{ label: strings.config.off, value: false },
						]}
						updateValue={newValue => updateValue('blurThumbnails', newValue)}
					/>
				</ConfigItem>

				<ConfigItem
					label={strings.config["adult-warn"]}
					helpAction={() => warnHScene()}>
					<ConfigButtons
						currentValue={conf.warnHScenes}
						btns={[
							{ label: strings.config.on, value: true },
							{ label: strings.config.off, value: false },
						]}
						updateValue={newValue => updateValue('warnHScenes', newValue)}
					/>
				</ConfigItem>
			</div>

			<ConfigItem label={strings.config.language}>
				<div className="config-btns">
					<Button
						nav-auto={1}
						className="config-btn flag"
						onClick={()=>setShowLanguage(true)}>
						{languages?.[settings.language]?.["display-name"]}... +{Object.keys(languages).length - 1}
					</Button>
				</div>
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
					btns={[
						{ label: strings.yes, value: true },
						{ label: strings.no, value: false },
					]}
					updateValue={newValue => updateValue('unlockEverything', newValue)}
				/>
			</ConfigItem>

			<ConfigItem label={strings.config.data}>
				<div className="config-btns">
					<Button className="config-btn"
						onClick={importData.bind(null, false)}
						onContextMenu={importData.bind(null, true)}
						nav-auto={1}>
						<MdFileUpload /> {strings.config["data-import"]}
					</Button>
					<Button className="config-btn"
						onClick={exportData}
						nav-auto={1}>
						<MdDownload /> {strings.config["data-export"]}
					</Button>
					<Button className="config-btn erase"
						onClick={eraseData}
						nav-auto={1}>
						<MdDeleteForever /> {strings.config["data-erase"]}
					</Button>
				</div>
			</ConfigItem>

			<ResetBtn onClick={handleReset} />

			<ConfigModal modal={modal} setModal={setModal} />
			<ModalLanguageSelection show={showLanguage} setShow={setShowLanguage} />
		</PageSection>
	)
}

export default ConfigAdvancedTab