import { ReactNode, useEffect, useState } from "react"
import { ConfigButtons, ConfigItem, ResetBtn } from "../ConfigLayout"
import { defaultSettings, settings } from "../../utils/settings"
import { savesManager, SaveState } from "../../utils/savestates"
import { strings, languages } from "../../translation/lang"
import { toast } from "react-toastify"
import { useLanguageRefresh } from "../hooks/useLanguageRefresh"
import { MdDeleteForever, MdDownload, MdFileUpload, MdTranslate } from "react-icons/md"
import ModalLanguageSelection from "./ModalLanguageSelection"
import ConfigModal from "./components/ConfigModal"
import Button from "@tsukiweb-common/ui-core/components/Button"
import PageSection from "@tsukiweb-common/ui-core/layouts/PageSection"
import { RecursivePartial } from "@tsukiweb-common/types"
import { deepAssign, jsonDiff, textFileUserDownload, requestJSONs } from "@tsukiweb-common/utils/utils"
import { bb } from "@tsukiweb-common/utils/Bbcode"
import { modalPromptService } from "@tsukiweb-common/ui-core/components/ModalPrompt"
import { APP_VERSION } from "utils/constants"
import { warnHScene } from "utils/display"

function twoDigits(n: number) {
	return n.toString().padStart(2, '0')
}

type Savefile = {
	version: string
	settings: RecursivePartial<typeof settings>,
	saveStates?: SaveState[],
}

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

	const updateValue = <T extends keyof typeof conf>(
		key: T,
		value: typeof conf[T]
	) => setConf(prev => ({ ...prev, [key]: value }))

	const exportData = () => {
		const content: Savefile = {
			version: APP_VERSION,
			settings: jsonDiff(settings, defaultSettings),
			saveStates: savesManager.listSaves(),
		}
		const date = new Date()
		const year = date.getFullYear(), month = date.getMonth()+1,
					day = date.getDate(), hour = date.getHours(), min = date.getMinutes()
		const dateString = [year, month, day].map(twoDigits).join('-')
		const timeString = [hour, min].map(twoDigits).join('-')
		textFileUserDownload(JSON.stringify(content), `${dateString}_${timeString}.thfull`, "application/thfull+json")
	}

	const importData = async (allExtensions=false) => {
		try {
			const json = (await requestJSONs({accept: allExtensions ? '*' : '.thfull'}) as Savefile[])?.[0] as Savefile|undefined
			if (!json)
				return
			if (!json.version)
				json.version = "0.3.6"
			const importedSettings = deepAssign(defaultSettings, json.settings, {clone: true})
			deepAssign(settings, importedSettings)
			if (json.saveStates != undefined) {
				savesManager.clear()
				savesManager.add(...json.saveStates)
			}

			toast("Your data has been loaded", {
				toastId: "loaded-data",
				type: "success",
			})
		} catch (e) {
			console.error(e)
			toast("Failed to load data", {
				toastId: "failed-data",
				type: "error",
			})
		}
	}

	const eraseData = async () => {
		const confirmed = await modalPromptService.confirm({
			text: strings.config["data-erase-warning"],
			labelYes: strings.yes,
			labelNo: strings.no,
			color: "#760101"
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
						className={`config-btn`}
						onClick={()=>setShowLanguage(true)}>
						<MdTranslate /> {languages[settings.language]["display-name"]}, ...
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
								<p key={i}>{bb(txt)}</p>
							)}
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
					helpAction={warnHScene}
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