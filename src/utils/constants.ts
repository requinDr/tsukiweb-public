import sceneAttrs from '@assets/game/scene_attrs.json'
import { Digit, PartialRecord, UcLetter } from '@tsukiweb-common/types'
import { CharId, RouteDayName, RouteName, SceneName } from '../types'
import { FcNodeAttrs, FcSceneGraphAttrs } from '@tsukiweb-common/flowchart'
import { Regard } from 'script/ScriptPlayer'

export const APP_VERSION = import.meta.env.VITE_PACKAGE_VERSION

export const SAVE_EXT = "thweb"
export const FULLSAVE_EXT = "thfull"
export const HISTORY_MAX_PAGES = 20
export const APP_INFO = {
  GITHUB_URL: "https://github.com/requinDr/tsukiweb-public",
  GITHUB_STARS: "https://img.shields.io/github/stars/requinDr/tsukiweb-public",
  FEEDBACK_URL: "https://forms.gle/MJorV8oNbnKo22469",
  REMAKE_URL: "http://typemoon.com/products/tsukihime/",
  GAME_VNDB: "https://vndb.org/v7",
  PLUS_DISC_VNDB: "https://vndb.org/v49"
}

export const CHARS: CharId[] = ['ark', 'cel', 'aki', 'his', 'koha']
type SceneNameFormat = `${RouteName}-${RouteDayName}${`-${string}`}`

export const SCENE_ATTRS: {
  'fc-nodes'?: Record<string, FcNodeAttrs>
  scenes: Record<SceneName, (
    {
      title: string
    } | {
      name: (SceneNameFormat |
             { flg: UcLetter, "0": SceneNameFormat, "1": SceneNameFormat })
    }
  ) & {
    h?: true
    osiete?: true
    graph?: FcSceneGraphAttrs
  } & (FcNodeAttrs | PartialRecord<keyof FcNodeAttrs, never>)>,
  badges: {
    regards: Record<keyof Regard, PartialRecord<SceneName, number>>,
    flags: PartialRecord<UcLetter|Digit, Array<SceneName>>
  }
} = JSON.parse(JSON.stringify(sceneAttrs))