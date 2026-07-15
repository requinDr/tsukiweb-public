import { CharId, RouteDayName, SceneName } from "../../../app/utils/types"
import { SCENE_ATTRS } from "../../../app/utils/constants"
import { strings } from "../../../translation/lang"
import { settings } from "../../../engine/settings"
import { viewedScene } from "../../../engine/settings"

type EndType = "normal"|"true"|"good"|"osiete"

class Ed {
  private _scene: SceneName
  private _char: CharId|undefined
  private _day: RouteDayName|undefined
  private _type: EndType

  constructor(scene: SceneName, char?: CharId, day?: RouteDayName<CharId>,
              type: EndType="osiete") {
    this._scene = scene
    this._type = type
    this._char = char
    this._day = day
  }

  get scene() { return this._scene }
  get type() { return this._type }
  get char() { return this._char }
  get day() { return this._day }

  get seen() {
    return viewedScene(this._scene) || settings.unlockEverything
  }
  get name() {
    if (this._char && this._day)
      return strings.scenario.routes[this._char][this._day]
    else return undefined
  }
}

type Ending<T extends EndType=EndType> = Readonly<{
  scene: SceneName,
  type: T,
  seen: boolean,
  name: string,
  char: CharId | (T extends "osiete" ? undefined : CharId),
  day: RouteDayName | (T extends "osiete" ? undefined : RouteDayName),
}>
export type RouteEnding = Ending<Exclude<EndType, "osiete">>
export type OsieteEnding = Ending<"osiete">


export const endings = {
  ark_good    : new Ed("s53a", "ark" , "13b", "good") as RouteEnding,
  ark_true    : new Ed("s52a", "ark" , "13a", "true") as RouteEnding,
  ciel_good   : new Ed("s308", "cel" , "13b", "good") as RouteEnding,
  ciel_true   : new Ed("s310", "cel" , "13a", "true") as RouteEnding,
  akiha_good  : new Ed("s384", "aki" , "13b", "normal") as RouteEnding,
  akiha_true  : new Ed("s385", "aki" , "13a", "true") as RouteEnding,
  hisui_good  : new Ed("s413", "his" , "14b", "good") as RouteEnding,
  hisui_true  : new Ed("s412", "his" , "14a", "true") as RouteEnding,
  kohaku_true : new Ed("s429", "koha", "12a", "true") as RouteEnding,
}

export const osiete = Object.fromEntries(
  SCENE_ATTRS['scene-osiete'].map(name=> {
    switch (name) {
      case "s516": return [name, new Ed(name, "cel" , "09b") as OsieteEnding] //s107,
      case "s518": return [name, new Ed(name, "ark" , "11b") as OsieteEnding] //s186,
      case "s532": return [name, new Ed(name, "aki" , "03b") as OsieteEnding] //s234,
      case "s523": return [name, new Ed(name, "cel" , "11b") as OsieteEnding] //s289,
      case "s528": return [name, new Ed(name, "his" , "07b") as OsieteEnding] //s396,
      case "s539": return [name, new Ed(name, "aki" , "13b") as OsieteEnding] //s509,
      // case "s510": return [name, new Ed(name, "cel" , "09b") as OsieteEnding] //s510,
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
) as Record<SceneName, OsieteEnding>