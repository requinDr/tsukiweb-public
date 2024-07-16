import { displayMode, isViewAnyOf } from "./display"
import KeyMap, { KeyMapMapping } from "@tsukiweb-common/utils/KeyMap"


export const inGameKeymap: KeyMapMapping = {
	"next":     [()=> isViewAnyOf("text", "graphics"),
							{key: "Enter"},
							{key: "Control", repeat: true},
							{key: "Meta", repeat: true},
							{key: "ArrowDown", repeat: false},
							{key: "ArrowRight", repeat: false}],
	"back":     [{key: "Escape", repeat: false},
							{key: "Backspace", repeat: false}],
	"history":  [()=> isViewAnyOf("text", "dialog"),
							{key: "ArrowUp", repeat: false},
							{key: "ArrowLeft", repeat: false},
							{key: "H", repeat: false}],
	"graphics": [{code: "Space", repeat: false, [KeyMap.condition]: ()=>isViewAnyOf("text", "graphics", "dialog")}],
	"bg_move":  [()=> isViewAnyOf("text", "graphics"),
							{key: "ArrowUp", ctrlKey: true, repeat: false, [KeyMap.args]: "up"},
							{key: "ArrowDown", ctrlKey: true, repeat: false, [KeyMap.args]: "down"}],
	"auto_play":[()=> displayMode.currentView == "text",
							{key: "E", repeat: false}],
	"page_nav": [()=> isViewAnyOf("text", "graphics", "dialog"),
							{key: "PageUp", [KeyMap.args]: "prev"},
							{key: "PageDown", [KeyMap.args]: "next"}],
	"load":     [{key: "A", repeat: false, [KeyMap.condition]: ()=> isViewAnyOf("text", "graphics")}],
	"save":     [{key: "Z", repeat: false, [KeyMap.condition]: ()=> isViewAnyOf("text", "graphics")}],
	"q_save":   [{key: "S", repeat: false, [KeyMap.condition]: ()=> !displayMode.saveScreen}],
	"q_load":   [{key: "L", repeat: false, [KeyMap.condition]: ()=> !displayMode.saveScreen}],
	"config":   [{key: "C", repeat: false, [KeyMap.condition]: ()=> isViewAnyOf("text", "graphics")}],
}
