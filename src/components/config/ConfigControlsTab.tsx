import { useRef } from "react"
import { strings } from "../../translation/lang"
import { useLanguageRefresh } from "../../hooks/useLanguageRefresh"
import { PageSection } from "@tsukiweb-common/ui-core"
import { KeymapKeyFilter } from "@tsukiweb-common/input/KeyMap"
import { bb } from "@tsukiweb-common/utils/Bbcode"
import { inGameKeyMap } from "utils/keybind"

type KeyMapEntry = [string, typeof inGameKeyMap[keyof typeof inGameKeyMap]]

function convertAction([action, keys]: KeyMapEntry) : [string, KeymapKeyFilter[]] {
	return [
		action,
		Array.isArray(keys) ?
			keys.filter(x=>x.constructor != Function && Object.hasOwn(x, 'key')) as KeymapKeyFilter[]
		: [keys]
	]
}

const ConfigControlsTab = () => {
	useLanguageRefresh()
	const controlStrings = strings.config.controls as Record<string, string>
	const keymap = useRef<[string, KeymapKeyFilter[]][]>(
			Object.entries(inGameKeyMap)
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
						<kbd key={`${code || key}`} className="keyItem">
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
						</kbd>
					)}
				</div>
			)}
		</PageSection>
	)
}

export default ConfigControlsTab