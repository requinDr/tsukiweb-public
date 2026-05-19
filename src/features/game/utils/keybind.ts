import { GamepadEventGenerator, GamepadEvents } from "@tsukiweb-common/input/gamepad";
import {EventActions as EA, EventFilter} from "@tsukiweb-common/input/eventActions";

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
        {type: 'keydown', key: "ArrowUp"    , repeat: false, ctrlKey: true, [EA.ARGS]: ["up"]},
        {type: 'keydown', key: "ArrowDown"  , repeat: false, ctrlKey: true, [EA.ARGS]: ["down"]}],
    "auto_play":[
        {type: 'keydown', key: "E"          , repeat: false},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.LB}],
    "page_nav":[
        {type: 'keydown', key: "PageUp"     , ctrlKey: false, [EA.ARGS]: ["prev"]},
        {type: 'keydown', key: "PageDown"   , ctrlKey: false, [EA.ARGS]: ["next"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.LT, [EA.ARGS]: ["prev"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.RT, [EA.ARGS]: ["next"]}],
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
        {type: 'keydown', key: "ArrowUp"   , ctrlKey: false, [EA.ARGS]: ["up"]},
        {type: 'keydown', key: "ArrowLeft" , ctrlKey: false, [EA.ARGS]: ["left"]},
        {type: 'keydown', key: "ArrowDown" , ctrlKey: false, [EA.ARGS]: ["down"]},
        {type: 'keydown', key: "ArrowRight", ctrlKey: false, [EA.ARGS]: ["right"]},
        {type: 'keydown', key: "Escape"    , repeat: false, ctrlKey: false, [EA.ARGS]: ["out"]},
        {type: 'keydown', key: "Backspace" , repeat: false, ctrlKey: false, [EA.ARGS]: ["out"]},
        {type: 'keydown', key: "Enter"     , repeat: false, ctrlKey: false, [EA.ARGS]: ["in"]},
        {type: 'keydown', key: "Space"     , repeat: false, ctrlKey: false, [EA.ARGS]: ["in"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.DPadUp, [EA.ARGS]: ["up"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.DPadLeft, [EA.ARGS]: ["left"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.DPadDown, [EA.ARGS]: ["down"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.DPadRight, [EA.ARGS]: ["right"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.A, [EA.ARGS]: ["in"]},
        {type: GamepadEvents.BTN_PRESSED, buttonId: Gamepad.B, [EA.ARGS]: ["out"]},
        {type: GamepadEvents.AXIS_CHANGE, axisId: 0, [EA.IF]: (_, e)=> e.axisValue < -0.5, [EA.ARGS]: ["left"]},
        {type: GamepadEvents.AXIS_CHANGE, axisId: 0, [EA.IF]: (_, e)=> e.axisValue >  0.5, [EA.ARGS]: ["right"]},
        {type: GamepadEvents.AXIS_CHANGE, axisId: 1, [EA.IF]: (_, e)=> e.axisValue < -0.5, [EA.ARGS]: ["up"]},
        {type: GamepadEvents.AXIS_CHANGE, axisId: 1, [EA.IF]: (_, e)=> e.axisValue >  0.5, [EA.ARGS]: ["down"]},
        {type: GamepadEvents.AXIS_CHANGE, axisId: 2, [EA.IF]: (_, e)=> e.axisValue < -0.5, [EA.ARGS]: ["left"]},
        {type: GamepadEvents.AXIS_CHANGE, axisId: 2, [EA.IF]: (_, e)=> e.axisValue >  0.5, [EA.ARGS]: ["right"]},
        {type: GamepadEvents.AXIS_CHANGE, axisId: 3, [EA.IF]: (_, e)=> e.axisValue < -0.5, [EA.ARGS]: ["up"]},
        {type: GamepadEvents.AXIS_CHANGE, axisId: 3, [EA.IF]: (_, e)=> e.axisValue >  0.5, [EA.ARGS]: ["down"]},
    ],
}

GamepadEventGenerator.config({
    btnPress: true,
    axisChange: true,
    axesDeadZones: 0.8,
    axesResolution: 1, // rounded to -1, 0 or 1
})
GamepadEventGenerator.enable()