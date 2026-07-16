import { Dispatch } from "react"
import { languages, useStrings } from "translation/lang"
import { settings } from "engine/settings"
import { Button, Modal } from "@tsukiweb-common/ui-core"
import { sortTranslations } from "@tsukiweb-common/translation/lang"
import { polyfillCountryFlagEmojis } from "@tsukiweb-common/utils/flagsPolyfill"
import { audio } from "engine/audio"

let flagSupportChecked = false

type Props = {
	show: boolean
	setShow: Dispatch<boolean>
}
const ModalLanguageSelection = ({show, setShow}: Props) => {
	const strings = useStrings()
	if (!flagSupportChecked) {
		polyfillCountryFlagEmojis()
		flagSupportChecked = true
	}
	const selectLanguage = (id: string) => {
		settings.language = id
	}
	
	// place japanese first, then user locales, then other in alphabetical order
	const sortedLanguages = sortTranslations(languages, ["ja", ...navigator.languages])

	return (
		<Modal
			show={show}
			onRequestClose={() => setShow(false)}
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
								variant="select"
								onClick={selectLanguage.bind(null, id)}
								className="language flag"
								active={selected}
								audio={audio}
								clickSound="glass"
								nav-auto={1}
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
								{strings.translation.name}
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
								PLUS-DISC - {strings["translation-pd"].name}
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
				audio={audio}
				clickSound="close"
				nav-auto={1}
			>
				{strings.close}
			</Button>
		</Modal>
	)
}

export default ModalLanguageSelection