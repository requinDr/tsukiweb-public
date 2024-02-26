import { SpritePos } from "./components/molecules/GraphicsGroup"

export type PageType = 'text'|'choice'|'skip'|'phase'
export type PageContent<T extends PageType> =
  T extends 'text' ? { text: string } :
  T extends 'choice' ? { choices: Choice[], selected?: number} :
  T extends 'skip' ? { scene: SceneName } :
  T extends 'phase' ? { } :
  never
export type PageArgs<T extends PageType> =
  T extends 'text' ? [string] :
  T extends 'choice' ? [Choice[]] :
  T extends 'skip' ? [SceneName] :
  T extends 'phase' ? [] :
  never

export type Graphics = PartialRecord<SpritePos, string> & {
  monochrome ?: string
}

export type Choice = {
  index: number,
  str: string,
  label: LabelName,
}

export type Background = {
  image: string,
  type: string,
}

export type Sprite = {
  image: string,
  type: string
}

export enum ViewRatio {
  unconstrained = "",
  fourByThree = "4/3",
  sixteenByNine = "16/9",
}

export type KeysMatching<T extends object, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never
}[keyof T];

export type RecursivePartial<T> = T|{
  [P in keyof T]?: RecursivePartial<T[P]>
}
export type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T
}

export type JSONPrimitive = string|number|boolean|null
export type JSONObject = {
  [key:string]: JSONPrimitive|JSONObject|Array<JSONPrimitive|JSONObject>
}

export type Digit = '0'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'
export type LcLetter = 'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'|'i'|'j'|'k'
      |'l'|'m'|'n'|'o'|'p'|'q'|'r'|'s'|'t'|'u'|'v'|'w'|'x'|'y'|'z'
export type UcLetter = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'
      |'L'|'M'|'N'|'O'|'P'|'Q'|'R'|'S'|'T'|'U'|'V'|'W'|'X'|'Y'|'Z'
export type Letter = LcLetter|UcLetter

export type RouteName = 'aki'|'ark'|'cel'|'his'|'koha'|'others'
export type RouteDayName<T extends RouteName=RouteName> = 
  T extends 'others' ? 'pro'|'epi'|'end'|'fin'
                     : `${number}${'a'|'b'}`

export type CharId = RouteName//Exclude<RouteName, "others">

export type SceneName = `s${number}${'a'|''}` |
  "openning" | "ending" | "eclipse"

export type FBlockName = `f${number}${''|'a'|'b'|'half'|'_0'}`

export type LabelName = SceneName | FBlockName | `skip${number}${'a'|''}` |
  'endofplay'

export type NumVarName = `%${string}`
export type StrVarName = `$${string}`
export type VarName = NumVarName | StrVarName

export type FcNodeAttrs = {
  col: number
  from: string[]
  cutAt?: number
  align?: string
}

export type FcSceneAttrs = FcNodeAttrs & {
  graph: Graphics
}