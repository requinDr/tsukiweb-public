import { NumVarName, StrVarName, VarName } from "@tsukiweb-common/types"
import { RouteName, RouteDayName } from "../types"
import { endings } from "./endings"
import { deepAssign } from "@tsukiweb-common/utils/utils"
import { gameContext } from "./gameContext"

//##############################################################################
//#region                       VARIABLE PROXIES
//##############################################################################

//___________________________________endings____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const endingsProxy = new Proxy({}, {
  get(_, name: string) {
    if (Object.hasOwn(endings, name))
      return (endings[name as keyof typeof endings]).seen ? 1 : 0
    switch(name) {
      case "ark"    : return (endings.ark_good.seen ? 1 : 0)
                           + (endings.ark_true.seen ? 1 : 0)
      case "ciel"   : return (endings.ciel_good.seen ? 1 : 0)
                           + (endings.ciel_true.seen ? 1 : 0)
      case "akiha"  : return (endings.akiha_good.seen ? 1 : 0)
                           + (endings.akiha_true.seen ? 1 : 0)
      case "hisui"  : return (endings.hisui_good.seen ? 1 : 0)
                           + (endings.hisui_true.seen ? 1 : 0)
      case "kohaku" : return (endings.kohaku_true.seen ? 1 : 0)
      case "cleared" : return endingsProxy.ark + endingsProxy.ciel +
          endingsProxy.akiha + endingsProxy.hisui + endingsProxy.kohaku
    }
  },
  set() { return true } // setter prevents error when script tries to write values
}) as Record<keyof typeof endings, 0|1> &
    {ark: 0|1|2, ciel: 0|1|2, akiha: 0|1|2, hisui: 0|1|2, kohaku: 0|1,
     cleared: number}

//____________________________________flags_____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const flagsProxy = new Proxy({}, {
  get(_, flag: string) {
    return gameContext.flags.includes(flag) ? 1 : 0
  },
  set(_, flag: string, value: number) {
    if (value == 0 && gameContext.flags.includes(flag))
      gameContext.flags.splice(gameContext.flags.indexOf(flag),1)
    else if (value == 1 && !gameContext.flags.includes(flag)) {
      gameContext.flags.push(flag)
      gameContext.flags.sort()
    }
    return true
  }
})

//____________________________________phase_____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const routePhaseRE = /word\/p(?<route>[a-z]+)_(?<rDay>\d+[ab])/
const parseTitleA = (val: string)=> val.match(routePhaseRE)?.groups ?? {}
const dayPhaseRE = /word\/day_(?<day>\d+)/
const rawScenePhaseRE = /word\/(?<scene>\w+)/
const parseTitleB = (val: string)=> val.match(dayPhaseRE)?.groups ??
                                    val.match(rawScenePhaseRE)?.groups ?? {}

const phaseProxy = new Proxy({}, {
  get (_, varName: `phase${`title_${'a'|'b'}`|'bg'}`) {
    const {route, routeDay, day, bg} = gameContext.phase
    switch(varName) {
      case "phasebg" : return `"${bg}"`
      case "phasetitle_a" :
        return route != "" ? `"word/p${route}_${routeDay}"`
                           : `#000000`
      case "phasetitle_b" :
        return day.constructor == String ?
              `"word/${day}`
            : day as number > 0 ?
              `"word/day_${day.toString().padStart(2, "0")}`
            : ""
    }
  },
  set (_, varName: `phase${`title_${'a'|'b'}`|'bg'}`, value: string) {
    switch(varName) {
      case "phasebg" : gameContext.phase.bg = value; return true
      case "phasetitle_a" :
        if (value.startsWith('#')) {
          deepAssign(gameContext.phase, {route: '', routeDay: ''})
        } else {
          const {route = "", rDay = ""} = parseTitleA(value.toLowerCase())
          if (!(route && rDay))
            throw Error(`Cannot parse $${varName},${value}`)
          deepAssign(gameContext.phase, {
            route : (route as RouteName) || "others",
            routeDay : (rDay as RouteDayName) || ""
          })
        }
        return true
      case "phasetitle_b" :
        if (value == '""')
          gameContext.phase.day = 0
        else {
          const {day = "", scene = ""} = parseTitleB(value.toLowerCase())
          if (!day && !scene)
            throw Error(`Cannot parse ${varName} ${value}`)
          gameContext.phase.day = parseInt(day) || scene as RouteDayName<'others'>
        }
        return true
      default :
        return false
    }
  }
})

//#endregion ###################################################################
//#region                      GET / SET VARIABLES
//##############################################################################

function getVarLocation(fullName: VarName): [any, string] {
  if (!['$','%'].includes(fullName.charAt(0)))
    throw Error(`Ill-formed variable name in 'mov' command: "${fullName}"`)
  let name = fullName.substring(1)
  let parent
  if (['rockending', 'flushcount', 'page'].includes(name)) {
    parent = gameContext // 'page' is incremented after phases transitions
  }
  else if (name.startsWith("phase")) {
    parent = phaseProxy
  }
  else if (/^flg[1-9A-Z]$/.test(name)) {
    parent = flagsProxy
    name = name.charAt(3)
  }
  else if (/^[a-z]+_regard$/.test(name)) {
    parent = gameContext.regard
    name = name.substring(0,name.indexOf('_'))
  }
  else if (/^clear(ed|_[a-z]+)/.test(name)) {
    parent = endingsProxy
    name = name.substring(name.indexOf('_')+1) // 0 if no '_' in name
  }
  else if (name == "ark_normalcleared") {
    parent = endingsProxy
    name = "ark_true"
  }
  else {
    throw Error(`Unknown variable ${name}`)
  }
  return [parent, name]
}
export function getGameVariable(name: NumVarName): number;
export function getGameVariable(name: StrVarName): string;
export function getGameVariable(name: VarName) : number|string
export function getGameVariable(name: VarName) {
  const [parent, attrName] = getVarLocation(name)
  return parent[attrName as keyof typeof parent]
}

export function setGameVariable(name: NumVarName, value: number): void;
export function setGameVariable(name: StrVarName, value: string): void;
export function setGameVariable(name: VarName, value: number|string): void
export function setGameVariable(name: VarName, value: number|string) {
  if (name.charAt(0) == '%')
    value = +value // convert to number if the value is a string
  const [parent, attrName] = getVarLocation(name)
  parent[attrName as keyof typeof parent] = value
}

//#endregion ###################################################################
//#region                           COMMANDS
//##############################################################################

function processVarCmd(arg: string, cmd: string) {
  const [name, v] = arg.split(',') as [VarName, string]
  let currVal = getGameVariable(name)
  if (currVal === null && cmd != 'mov')
    throw Error(`Reading undefined variable. [${cmd} ${arg}]`)

  switch (cmd) {
    case 'mov' : setGameVariable(name, v); break
    case 'add' : setGameVariable(name, currVal as number + parseInt(v)); break
    case 'sub' : setGameVariable(name, currVal as number - parseInt(v)); break
    case 'inc' : setGameVariable(name, currVal as number + 1); break
    case 'dec' : setGameVariable(name, currVal as number - 1); break
  }
}

export const commands = {
  'mov': processVarCmd,
  'add': processVarCmd,
  'sub': processVarCmd,
  'inc': processVarCmd,
  'dec': processVarCmd,
}

//#endregion ###################################################################
//#region                             DEBUG
//##############################################################################

declare global {
  interface Window {
    [key: string]: any
  }
}
window.g = window.gameContext = gameContext
