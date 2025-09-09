import { Digit, FcNodeAttrs, FcSceneAttrs, UcLetter } from '@tsukiweb-common/types'
import sceneAttrs from '../assets/game/scene_attrs.json'
import { RouteDayName, RouteName, TsukihimeSceneName } from '../types'

export const APP_VERSION = import.meta.env.VITE_VERSION

export const SCENE_ATTRS: {
  'fc-nodes'?: Record<string, FcNodeAttrs>,
  scenes: Record<TsukihimeSceneName, ({
    title: string,
  } | {
      r: (RouteName | { flg: UcLetter|Digit, "0": RouteName, "1": RouteName }),
      d: RouteDayName
      s?: (string | { flg: UcLetter|Digit, "0": string, "1": string }),
  }) & {
    h?: true
    osiete?: true
    fc?: FcSceneAttrs
  }>
} = JSON.parse(JSON.stringify(sceneAttrs))

export const SAVE_EXT = "thweb"
export const FULLSAVE_EXT = "thfull"
export const HISTORY_MAX_PAGES = 20
export const APP_INFO = {
  GITHUB_URL: "https://github.com/requinDr/tsukiweb-public",
  GITHUB_STARS: "https://img.shields.io/github/stars/requinDr/tsukiweb-public?style=social",
  FEEDBACK_URL: "https://forms.gle/MJorV8oNbnKo22469",
  REMAKE_URL: "http://typemoon.com/products/tsukihime/",
  TSUKI_VNDB: "https://vndb.org/v7",
  PLUS_DISC_VNDB: "https://vndb.org/v49"
}