import sceneAttrs from '@assets/game/scene_attrs.json'
import { PartialRecord } from '@tsukiweb-common/types'
import { ThumbnailsGraphics } from '@tsukiweb-common/graphics'
import { CharId, SceneName } from './types';

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

export const SCENE_ATTRS: {
  'scene-names': PartialRecord<SceneName, string>,
  'scene-graphs': PartialRecord<SceneName, ThumbnailsGraphics>,
  'scene-deadEnds': Array<SceneName>,
  'scene-osiete': Array<SceneName>,
  'scene-ero': Array<SceneName>,
} = sceneAttrs as any