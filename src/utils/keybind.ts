import KeyMap from "@tsukiweb-common/utils/KeyMap";

export const inGameKeyMap = {
    "next":    [
        {key: "Enter"},
        {key: "Control", repeat: true},
        {key: "Meta", repeat: true},
        {key: "ArrowDown", repeat: false},
        {key: "ArrowRight", repeat: false}],
    "back":    [
        {key: "Escape", repeat: false},
        {key: "Backspace", repeat: false}],
    "history": [
        {key: "ArrowUp", repeat: false},
        {key: "ArrowLeft", repeat: false},
        {key: "H", repeat: false}],
    "graphics": [
        {code: "Space", repeat: false}],
    "bg_move": [
        {key: "ArrowUp", ctrlKey: true, repeat: false, [KeyMap.args]: "up"},
        {key: "ArrowDown", ctrlKey: true, repeat: false, [KeyMap.args]: "down"}],
    "auto_play":[
        {key: "E", repeat: false}],
    "page_nav":[
        {key: "PageUp", [KeyMap.args]: "prev"},
        {key: "PageDown", [KeyMap.args]: "next"}],
    "load":    [
        {key: "A", repeat: false}],
    "save":    [
        {key: "Z", repeat: false}],
    "q_save":  [
        {key: "S", repeat: false}],
    "q_load":  [
        {key: "L", repeat: false}],
    "config":  [
        {key: "C", repeat: false}],
}