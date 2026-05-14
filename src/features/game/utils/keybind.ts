import { GamepadEventGenerator, GamepadEvents } from "@tsukiweb-common/input/gamepad";
import {EventActions, EventFilter} from "@tsukiweb-common/input/eventActions";


export const inGameControls: Record<string, EventFilter[]> = {
    "next":    [
        {type: 'keydown', key: "Enter"},
        {type: 'keydown', key: "Control"    , repeat: true},
        {type: 'keydown', key: "Meta"       , repeat: true},
        {type: 'keydown', key: "ArrowDown"  , repeat: false, ctrlKey: false},
        {type: GamepadEvents.BTN_PRESSED, buttonId:  0}, // A
        {type: GamepadEvents.BTN_PRESSED, buttonId: 15}, //DPAD RIGHT
        {type: GamepadEvents.BTN_PRESSED, buttonId: 13}],//DPAD DOWN
    "back":    [
        {type: 'keydown', key: "Escape"     , repeat: false},
        {type: 'keydown', key: "Backspace"  , repeat: false},
        {type: GamepadEvents.BTN_PRESSED, buttonId: 1}, // B
        {type: GamepadEvents.BTN_PRESSED, buttonId: 2}, // X
        {type: GamepadEvents.BTN_PRESSED, buttonId: 9}],// START
    "history": [
        {type: 'keydown', key: "ArrowUp"    , repeat: false, ctrlKey: false},
        {type: 'keydown', key: "H"          , repeat: false},
        {type: GamepadEvents.BTN_PRESSED, buttonId: 12}], // DPAD UP
    "flowchart": [
        {type: 'keydown', key: "F"          , repeat: false, ctrlKey: false}],
    "graphics": [
        {type: 'keydown', code: "Space"     , repeat: false},
        {type: 'keydown', key: "Delete"     , repeat: false},
        {type: GamepadEvents.BTN_PRESSED, buttonId: 3}],
    "bg_move": [
        {type: 'keydown', key: "ArrowUp"    , repeat: false, ctrlKey: true, [EventActions.ARGS]: "up"},
        {type: 'keydown', key: "ArrowDown"  , repeat: false, ctrlKey: true, [EventActions.ARGS]: "down"}],
    "auto_play":[
        {type: 'keydown', key: "E"          , repeat: false}],
    "page_nav":[
        {type: 'keydown', key: "PageUp"     , ctrlKey: false, [EventActions.ARGS]: "prev"},
        {type: 'keydown', key: "PageDown"   , ctrlKey: false, [EventActions.ARGS]: "next"}],
    "load":    [
        {type: 'keydown', key: "A"          , repeat: false}],
    "save":    [
        {type: 'keydown', key: "Z"          , repeat: false}],
    "q_save":  [
        {type: 'keydown', key: "S"          , repeat: false}],
    "q_load":  [
        {type: 'keydown', key: "L"          , repeat: false}],
    "config":  [
        {type: 'keydown', key: "C"          , repeat: false}],
}

export const menuKeyMap: Record<string, EventFilter[]> = {
    "nav": [
        {type: 'keydown', key: "ArrowUp"   , ctrlKey: false, [EventActions.ARGS]: ["up"]},
        {type: 'keydown', key: "ArrowLeft" , ctrlKey: false, [EventActions.ARGS]: ["left"]},
        {type: 'keydown', key: "ArrowDown" , ctrlKey: false, [EventActions.ARGS]: ["down"]},
        {type: 'keydown', key: "ArrowRight", ctrlKey: false, [EventActions.ARGS]: ["right"]},
        {type: 'keydown', key: "Escape"    , repeat: false, ctrlKey: false, [EventActions.ARGS]: ["out"]},
        {type: 'keydown', key: "Backspace" , repeat: false, ctrlKey: false, [EventActions.ARGS]: ["out"]},
        {type: 'keydown', key: "Enter"     , repeat: false, ctrlKey: false, [EventActions.ARGS]: ["in"]},
        {type: 'keydown', key: "Space"     , repeat: false, ctrlKey: false, [EventActions.ARGS]: ["in"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: 12, [EventActions.ARGS]: ["up"]}, // DPAD UP
        {type: GamepadEvents.BTN_PRESSED, buttonId: 14, [EventActions.ARGS]: ["left"]}, // DPAD LEFT
        {type: GamepadEvents.BTN_PRESSED, buttonId: 13, [EventActions.ARGS]: ["down"]}, // DPAD DOWN
        {type: GamepadEvents.BTN_PRESSED, buttonId: 15, [EventActions.ARGS]: ["right"]}, // DPAD RIGHT
        {type: GamepadEvents.BTN_PRESSED, buttonId: 0, [EventActions.ARGS]: ["in"]}, // A
        {type: GamepadEvents.BTN_PRESSED, buttonId: 1, [EventActions.ARGS]: ["out"]}, // B
    ],
    "click": [
        {type: GamepadEvents.BTN_PRESSED, buttonId: 0, [EventActions.IF]: (_, e)=> e.target instanceof HTMLButtonElement}
    ]
}

GamepadEventGenerator.config({
    btnPress: true
})
GamepadEventGenerator.enable()