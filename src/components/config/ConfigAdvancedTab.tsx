import { useEffect, useState } from "react"
import { ConfigButtons, ConfigItem, ResetBtn } from "../ConfigLayout"
import { defaultSettings, settings } from "../../utils/settings"
import { deepAssign, jsonDiff, requestJSONs, textFileUserDownload } from "../../utils/utils"
import { SaveState, clearSaveStates, listSaveStates, restoreSaveStates } from "../../utils/savestates"
import { strings, languages } from "../../translation/lang"
import { RecursivePartial } from "../../types"
import { toast } from "react-toastify"
import { useLanguageRefresh } from "../hooks/useLanguageRefresh"
import { MdDeleteForever, MdDownload, MdFileUpload, MdQuestionMark, MdTranslate } from "react-icons/md"
import ModalLanguageSelection from "./ModalLanguageSelection"
import PageSection from "@ui-core/layouts/PageSection"
import { warnHScene } from "utils/script"
import Button from "@ui-core/components/Button"

function twoDigits(n: number) {
	return n.toString().padStart(2, '0')
}

type Savefile = {
	settings: RecursivePartial<typeof settings>,
	saveStates?: [number, SaveState][],
}

const ConfigAdvancedTab = () => {
	const [show, setShow] = useState<boolean>(false)

	const [conf, setConf] = useState(deepAssign({
		resolution: undefined,
		imagesFolder: undefined,
		language: undefined,
		blurThumbnails: undefined,
		warnHScenes: undefined,
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
			settings: jsonDiff(settings, defaultSettings),
			saveStates: listSaveStates(),
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
			const importedSettings = deepAssign(defaultSettings, json.settings, {clone: true})
			deepAssign(settings, importedSettings)
			if (json.saveStates != undefined) {
				clearSaveStates()
				restoreSaveStates(json.saveStates)
			}

			toast("Your data has been loaded", {
				toastId: "loaded-data",
				type: "success",
			})
		} catch (e) {
			toast("Failed to load data", {
				toastId: "failed-data",
				type: "error",
			})
		}
	}

	const eraseData = () => {
		if (confirm(strings.config["data-erase-warning"])) {
			clearSaveStates()
			deepAssign(settings, defaultSettings)
			setTimeout(()=> {
				localStorage.clear()
				alert(strings.config["data-erase-confirm"])
			}, 10) // leave room for asynchronous callbacks (if any) to complete
		}
	}

	const reset = () => {
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
						onClick={()=>setShow(true)}>
						<MdTranslate /> {languages[settings.language]["display-name"]}...
					</Button>
				</div>
			</ConfigItem>
			<ModalLanguageSelection show={show} setShow={setShow} />

			<div className="sub">
				<div className="title">{strings.config["adult-title"]}</div>
				<ConfigButtons
					title={strings.config["adult-blur"]}
					btns={[
						{ text: strings.config.on, value: true },
						{ text: strings.config.off, value: false },
					]}
					property="blurThumbnails"
					conf={conf}
					updateValue={updateValue}
				/>

				<ConfigButtons
					title={
						<>
							<span>{strings.config["adult-warn"]}</span>
							<button className="icon-help" style={{ marginLeft: 4}} onClick={warnHScene}>
								<MdQuestionMark />
							</button>
						</>
					 }
					btns={[
						{ text: strings.config.on, value: true },
						{ text: strings.config.off, value: false },
					]}
					property="warnHScenes"
					conf={conf}
					updateValue={updateValue}
				/>
			</div>

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

			<ResetBtn onClick={reset} />
		</PageSection>
	)
}

export default ConfigAdvancedTab