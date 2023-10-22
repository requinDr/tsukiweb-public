import { CharId, PartialRecord, RouteDayName, SceneName } from "../types"
import { SCENE_ATTRS } from "./constants"
import strings from "./lang"
import { settings } from "./variables"

type EndType = "normal"|"true"|"good"|"osiete"

class Ed {
  private _scene: SceneName
  private _char: CharId|undefined
  private _day: RouteDayName|undefined
  private _illus: string|undefined
  private _type: EndType

  constructor(scene: SceneName, char?: CharId, day?: RouteDayName<CharId>,
              type: EndType="osiete", illus?: string) {
    this._scene = scene
    this._type = type
    this._char = char
    this._day = day
    this._illus = illus
  }

  get scene() { return this._scene }
  get type() { return this._type }
  get char() { return this._char }
  get day() { return this._day }
  get image() { return this._illus }

  get seen() {
    return settings.completedScenes.includes(this._scene)
  }
  get name() {
    if (this._char && this._day)
      return strings.scenario.routes[this._char][this._day]
    else return undefined
  }
}
export type Ending<T extends EndType=EndType> = Readonly<{
  scene: SceneName,
  type: T,
  seen: boolean,
  name: string,
  char: CharId | (T extends "osiete" ? undefined : CharId),
  day: RouteDayName | (T extends "osiete" ? undefined : RouteDayName),
  image : T extends "osiete" ? undefined : string
}>
export type RouteEnding = Ending<Exclude<EndType, "osiete">>
export type OsieteEnding = Ending<"osiete">


export const endings = {
  ark_good    : new Ed("s53a", "ark" , "13b", "good"  , "ark_f02" ) as RouteEnding,
  ark_true    : new Ed("s52a", "ark" , "13a", "true"  , "ark_f03" ) as RouteEnding,
  ciel_good   : new Ed("s308", "cel" , "13b", "good"  , "cel_e07a") as RouteEnding,
  ciel_true   : new Ed("s310", "cel" , "13a", "true"  , "cel_f02" ) as RouteEnding,
  akiha_good  : new Ed("s384", "aki" , "13b", "normal", "aki_f01" ) as RouteEnding,
  akiha_true  : new Ed("s385", "aki" , "13a", "true"  , "aki_f02" ) as RouteEnding,
  hisui_good  : new Ed("s413", "his" , "14b", "good"  , "his_f02" ) as RouteEnding,
  hisui_true  : new Ed("s412", "his" , "14a", "true"  , "his_f03" ) as RouteEnding,
  kohaku_true : new Ed("s429", "koha", "12a", "true"  , "koha_f01") as RouteEnding,
}

export const osiete = Object.fromEntries(
  Object.entries(SCENE_ATTRS.scenes).filter(([_, {osiete}])=> osiete).map(
    ([name])=> {
      switch (name) {
        case "s516": return [name, new Ed(name, "cel" , "09b") as OsieteEnding] //s107,
        case "s518": return [name, new Ed(name, "ark" , "11b") as OsieteEnding] //s186,
        case "s532": return [name, new Ed(name, "aki" , "03b") as OsieteEnding] //s234,
        case "s523": return [name, new Ed(name, "cel" , "11b") as OsieteEnding] //s289,
        case "s528": return [name, new Ed(name, "his" , "07b") as OsieteEnding] //s396,
        case "s539": return [name, new Ed(name, "aki" , "13b") as OsieteEnding] //s509,
        //case "s510": return [name, new _Ending(name, "cel" , as OsieteEnding "09b")] //s510,
        case "s521": return [name, new Ed(name, "ark" , "13b") as OsieteEnding] //s53a
        case "s520": return [name, new Ed(name, "ark" , "13a") as OsieteEnding] //s52a
        case "s526": return [name, new Ed(name, "cel" , "13b") as OsieteEnding] //s308
        case "s527": return [name, new Ed(name, "cel" , "13a") as OsieteEnding] //s310
        case "s542": return [name, new Ed(name, "aki" , "13b") as OsieteEnding] //s384
        case "s541": return [name, new Ed(name, "aki" , "13a") as OsieteEnding] //s385
        case "s531": return [name, new Ed(name, "his" , "14b") as OsieteEnding] //s413
        case "s530": return [name, new Ed(name, "his" , "14a") as OsieteEnding] //s412
        case "s545": return [name, new Ed(name, "koha", "12a") as OsieteEnding] //s429
      }
      return [name, new Ed(name as SceneName) as OsieteEnding]
    }
  )
) as PartialRecord<SceneName, OsieteEnding>