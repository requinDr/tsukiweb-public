import { useRef } from "react"
import { inGameKeymap } from "../../utils/KeyMap"
import { strings } from "../../translation/lang"
import { bb } from "../../utils/Bbcode"
import { useLanguageRefresh } from "../hooks/useLanguageRefresh"
import PageSection from "@tsukiweb-common/ui-core/layouts/PageSection"
import { KeymapKeyFilter } from "@tsukiweb-common/utils/KeyMap"

type KeyMapEntry = [string, typeof inGameKeymap[keyof typeof inGameKeymap]]

function convertAction([action, keys]: KeyMapEntry) : [string, KeymapKeyFilter[]] {
	return [
		action,
		Array.isArray(keys) ?
			keys.filter(x=>x.constructor != Function) as KeymapKeyFilter[]
		: [keys]
	]
}

const ConfigControlsTab = () => {
	useLanguageRefresh()
	const controlStrings = strings.config.controls as Record<string, string>
	const keymap = useRef(
			Object.entries(inGameKeymap)
						.filter(([action, _])=> Object.hasOwn(controlStrings, action))
						.map(convertAction))
	return (
		<PageSection>
			{keymap.current.map(([action, keys], i)=> 
				<div key={i} className="keyMap">
					<div className="action">
						{bb(controlStrings[action])}
					</div>

					{keys.map(({code, key, ctrlKey, altKey, shiftKey, repeat})=>
						<div key={`${code || key}`} className="keyItem">
							{ctrlKey ? "Ctrl + " : ""}
							{altKey ? "Alt + " : ""}
							{shiftKey ? "Shift + " : ""}
							{code || key}
							{repeat != undefined && (
								repeat && <>
									&nbsp;
									<span className="info">
										{bb(controlStrings["_hold"])}
									</span>
								</>
							)}
						</div>
					)}
				</div>
			)}
		</PageSection>
	)
}

export default ConfigControlsTab