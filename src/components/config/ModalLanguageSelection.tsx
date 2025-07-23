import Modal from "@tsukiweb-common/ui-core/components/Modal"
import { Dispatch } from "react"
import { MdOpenInNew } from "react-icons/md"
import { languages, strings } from "translation/lang"
import { settings } from "utils/settings"
import { deepAssign, splitFirst } from "@tsukiweb-common/utils/utils"
import Button from "@tsukiweb-common/ui-core/components/Button"
import { LangDesc } from "@tsukiweb-common/utils/lang"

type Props = {
	show: boolean
	setShow: Dispatch<boolean>
}
const ModalLanguageSelection = ({show, setShow}: Props) => {
	const selectLanguage = (id: string) => {
		deepAssign(settings, {language: id})
	}
	const orderedLocales = navigator.languages
	
	// 1. place japanese first
	const sortedLanguages = Object.entries(languages)
	const japIndex = sortedLanguages.findIndex(([key, value])=>key == "jp")
	sortedLanguages.unshift(sortedLanguages.splice(japIndex, 1)[0])

	// 2. then place user languages
	let sortedLength = 1
	for (let locale of orderedLocales) {
		const remainingLanguages = sortedLanguages.slice(sortedLength)
		let i = remainingLanguages.findIndex(([_, lang])=> lang.locale == locale)
		if (i == -1) {
			// if country-specific locale not found, search for language
			// without country
			i = remainingLanguages.findIndex(([_, lang])=>
				splitFirst(lang.locale, '-')[0] == locale)
		}
		if (i != -1) {
			i += sortedLength // because of slice(sortedLength) above
			const entry = sortedLanguages.splice(i, 1)[0]
			sortedLanguages.splice(sortedLength, 0, entry)
			sortedLength++
		}
	}

	// 3. then order alphabetically
	const langCompare = (lang1: [string, LangDesc], lang2: [string, LangDesc]) => {
		let name1 = lang1[1]["display-name"]
		let name2 = lang2[1]["display-name"]
		if (name1.charCodeAt(0) == 0xd83c) // country flag (4 bytes) (probably)
			name1 = name1.substring(4)
		if (name2.charCodeAt(0) == 0xd83c)
			name2 = name2.substring(4)
		return name1.localeCompare(name2)
	}
	const remLangs = sortedLanguages.splice(sortedLength).sort(langCompare)
	sortedLanguages.push(...remLangs)

	return (
		<Modal
			show={show}
			setShow={setShow}
			className="translation-switch-modale"
		>
			<div className="content">
				<div className="languages">
					{sortedLanguages
						.map(([id, {"display-name": dispName}]) => {
						const selected = settings.language === id
						
						return (
							<Button
								key={id}
								variant="corner"
								onClick={()=>selectLanguage(id)}
								className="language"
								active={selected}
							>
								{dispName}
							</Button>
						)
					})}
				</div>

				<div className="translation-details">
					{settings.language !== "jp" && <>
						<div className="line title">
							{strings.translation.name}
						</div>
						<div className="line">
							{strings.translation.desc}
						</div>
						<div className="line" style={{marginTop: "1em"}}>
							<a href={strings.translation.url} target="_blank">
								<MdOpenInNew /> {strings.translation.url}
							</a>
						</div>
						<div className="line">
							<a href={strings.translation.vndb} target="_blank">
								<MdOpenInNew /> {strings.translation.vndb}
							</a>
						</div>
					</>}
				</div>
			</div>

			<Button
				variant="menu"
				onClick={()=>setShow(false)}
				className="close-btn"
			>
				{strings.close}
			</Button>
		</Modal>
	)
}

export default ModalLanguageSelection