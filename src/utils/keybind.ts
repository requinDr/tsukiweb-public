import KeyMap from "@tsukiweb-common/input/KeyMap";

export const inGameKeyMap = {
    "next":    [
        {[KeyMap.editing]: false},
        {key: "Enter"},
        {key: "Control", repeat: true},
        {key: "Meta", repeat: true},
        {key: "ArrowDown", repeat: false, ctrlKey: false}],
    "back":    [
        {[KeyMap.editing]: false, repeat: false},
        {key: "Escape"},
        {key: "Backspace"}],
    "history": [
        {[KeyMap.editing]: false, repeat: false},
        {key: "ArrowUp", ctrlKey: false},
        {key: "H"}],
    "flowchart": [
        {[KeyMap.editing]: false, repeat: false},
        {key: "F", ctrlKey: false}
    ],
    "graphics": [
        {[KeyMap.editing]: false, repeat: false},
        {code: "Space"},
        {key: "Delete"}],
    "bg_move": [
        {[KeyMap.editing]: false, ctrlKey: true, repeat: false},
        {key: "ArrowUp", [KeyMap.args]: "up"},
        {key: "ArrowDown", [KeyMap.args]: "down"}],
    "auto_play":[
        {key: "E", repeat: false, [KeyMap.editing]: false}],
    "page_nav":[
        {[KeyMap.editing]: false, ctrlKey: false, },
        {key: "PageUp", [KeyMap.args]: "prev"},
        {key: "PageDown", [KeyMap.args]: "next"}],
    "load":    [
        {key: "A", repeat: false, [KeyMap.editing]: false}],
    "save":    [
        {key: "Z", repeat: false, [KeyMap.editing]: false}],
    "q_save":  [
        {key: "S", repeat: false, [KeyMap.editing]: false}],
    "q_load":  [
        {key: "L", repeat: false, [KeyMap.editing]: false}],
    "config":  [
        {key: "C", repeat: false, [KeyMap.editing]: false}],
}

export const menuKeyMap = {
    "nav": [
        {ctrlKey: false, [KeyMap.editing]: false},
        {key: "ArrowUp"   , [KeyMap.args]: "up"},
        {key: "ArrowLeft" , [KeyMap.args]: "left"},
        {key: "ArrowDown" , [KeyMap.args]: "down"},
        {key: "ArrowRight", [KeyMap.args]: "right"},
        //{code: "KeyW"     , [KeyMap.args]: "up"},
        //{code: "KeyA"     , [KeyMap.args]: "left"},
        //{code: "KeyS"     , [KeyMap.args]: "down"},
        //{code: "KeyD"     , [KeyMap.args]: "right"},
        {key: "Escape"    , repeat: false, [KeyMap.args]: "out"},
        {key: "Backspace" , repeat: false, [KeyMap.args]: "out"},
        {key: "Enter"     , repeat: false, [KeyMap.args]: "in"},
        {key: "Space"     , repeat: false, [KeyMap.args]: "in"},
    ]
}