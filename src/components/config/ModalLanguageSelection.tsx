import { Dispatch } from "react"
import { languages, strings } from "translation/lang"
import { settings } from "utils/settings"
import { deepAssign, splitFirst } from "@tsukiweb-common/utils/utils"
import { Button, Modal } from "@tsukiweb-common/ui-core"
import { LangDesc } from "@tsukiweb-common/utils/lang"
import { polyfillCountryFlagEmojis } from "@tsukiweb-common/utils/flagsPolyfill"

let flagSupportChecked = false
const EMOJI_REGEX = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+|^(\uD83C[\uDDE6-\uDDFF]\uD83C[\uDDE6-\uDDFF])/

const langCompare = (lang1: [string, LangDesc], lang2: [string, LangDesc]) => {
	let name1 = lang1[1]["display-name"]
	let name2 = lang2[1]["display-name"]

	// Remove leading emojis
	name1 = name1.replace(EMOJI_REGEX, '').trim()
	name2 = name2.replace(EMOJI_REGEX, '').trim()
	
	return name1.localeCompare(name2)
}

type Props = {
	show: boolean
	setShow: Dispatch<boolean>
}
const ModalLanguageSelection = ({show, setShow}: Props) => {

	if (!flagSupportChecked) {
		polyfillCountryFlagEmojis()
		flagSupportChecked = true
	}
	const selectLanguage = (id: string) => {
		deepAssign(settings, {language: id})
	}
	const orderedLocales = navigator.languages
	
	// 1. place japanese first
	const sortedLanguages = Object.entries(languages)
	const japIndex = sortedLanguages.findIndex(([key]) => key === "jp")
	if (japIndex !== -1) {
	  sortedLanguages.unshift(sortedLanguages.splice(japIndex, 1)[0])
	}

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
								className="language flag"
								active={selected}
							>
								{dispName}
							</Button>
						)
					})}
				</div>

				<div className="translation-details">
					{settings.language !== "jp" && <>
						<div className="game-credits">
							<div className="line title">
								Tsukihime - {strings.translation.name}
							</div>
							<div className="line">
								{strings.translation.desc}
							</div>
							<div className="links">
								<a href={strings.translation.url} target="_blank">
									website
								</a>
								<a href={strings.translation.vndb} target="_blank">
									VNDB
								</a>
							</div>
						</div>

						<div className="game-credits pd">
							<div className="line title">
								Tsukihime PLUS-DISC - {strings["translation-pd"].name}
							</div>
							<div className="line">
								{strings["translation-pd"].desc}
							</div>
							<div className="links">
								<a href={strings["translation-pd"].url} target="_blank">
									website
								</a>
								<a href={strings["translation-pd"].vndb} target="_blank">
									VNDB
								</a>
							</div>
						</div>
					</>}
				</div>
			</div>

			<Button
				variant="elevation"
				onClick={()=>setShow(false)}
				className="close-btn"
			>
				{strings.close}
			</Button>
		</Modal>
	)
}

export default ModalLanguageSelection