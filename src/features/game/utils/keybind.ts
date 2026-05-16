import { GamepadEventGenerator, GamepadEvents } from "@tsukiweb-common/input/gamepad";
import {EventActions, EventFilter} from "@tsukiweb-common/input/eventActions";

// XBOX controller button mapping
enum Gamepad {
    A = 0,
    B = 1,
    X = 2,
    Y = 3,
    LB = 4,
    RB = 5,
    LT = 6,
    RT = 7,
    Select = 8,
    Start = 9,
    L3 = 10, // left stick press
    R3 = 11, // right stick press
    DPadUp = 12,
    DPadDown = 13,
    DPadLeft = 14,
    DPadRight = 15,
    Home = 16
}

//TODO: fast forward (RB)
export const inGameControls: Record<string, EventFilter[]> = {
    "next":    [
        {type: 'keydown', key: "Enter"},
        {type: 'keydown', key: "Control"    , repeat: true},
        {type: 'keydown', key: "Meta"       , repeat: true},
        {type: 'keydown', key: "ArrowDown"  , repeat: false, ctrlKey: false},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.A},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.DPadDown},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.DPadRight}],
    "back":    [
        {type: 'keydown', key: "Escape"     , repeat: false},
        {type: 'keydown', key: "Backspace"  , repeat: false},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.B},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.Start}],
    "history": [
        {type: 'keydown', key: "ArrowUp"    , repeat: false, ctrlKey: false},
        {type: 'keydown', key: "H"          , repeat: false},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.DPadUp}],
    "flowchart": [
        {type: 'keydown', key: "F"          , repeat: false, ctrlKey: false}],
    "graphics": [
        {type: 'keydown', code: "Space"     , repeat: false},
        {type: 'keydown', key: "Delete"     , repeat: false},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.Y}],
    "bg_move": [
        {type: 'keydown', key: "ArrowUp"    , repeat: false, ctrlKey: true, [EventActions.ARGS]: ["up"]},
        {type: 'keydown', key: "ArrowDown"  , repeat: false, ctrlKey: true, [EventActions.ARGS]: ["down"]}],
    "auto_play":[
        {type: 'keydown', key: "E"          , repeat: false},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.LB}],
    "page_nav":[
        {type: 'keydown', key: "PageUp"     , ctrlKey: false, [EventActions.ARGS]: ["prev"]},
        {type: 'keydown', key: "PageDown"   , ctrlKey: false, [EventActions.ARGS]: ["next"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.LT, [EventActions.ARGS]: ["prev"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.RT, [EventActions.ARGS]: ["next"]}],
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
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.DPadUp, [EventActions.ARGS]: ["up"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.DPadLeft, [EventActions.ARGS]: ["left"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.DPadDown, [EventActions.ARGS]: ["down"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.DPadRight, [EventActions.ARGS]: ["right"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.A, [EventActions.ARGS]: ["in"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.B, [EventActions.ARGS]: ["out"]},
    ],
    "click": [
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.A, [EventActions.IF]: (_, e)=> e.target instanceof HTMLButtonElement}
    ]
}

GamepadEventGenerator.config({
    btnPress: true
})
GamepadEventGenerator.enable()