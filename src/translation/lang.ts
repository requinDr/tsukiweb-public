import { RouteName, RouteDayName, Digit, JSONObject } from "../types"
import defaultStrings from "../assets/lang/default.json"
import { observe, useObserver } from "../utils/Observer"
import { SCENE_ATTRS } from "../utils/constants"
import { StoredJSON } from "../utils/storage"
import { TSForceType, deepAssign, fetchJson } from "../utils/utils"
import { settings } from "../utils/settings"

//##############################################################################
//#                                  PRIVATE                                   #
//##############################################################################

//______________________________private constants_______________________________
//------------------------------------------------------------------------------

const LANG_DIR = `${import.meta.env.BASE_URL}static/`
const LANGUAGES_LIST_URL = `${LANG_DIR}languages.json`

//________________________________private types_________________________________
//------------------------------------------------------------------------------

type UpdateDateFormat = `${number}-${number}-${number}` // YYYY-MM-DD

type LangDesc = {
  'display-name': string
  'locale': string
  'last-update': UpdateDateFormat
  'dir': string
  'fallback'?: TranslationId
  'authors'?: string
}

type LanguagesType = Record<TranslationId, LangDesc>

type StringsType = typeof defaultStrings & {
  id: TranslationId,
  lastUpdate: UpdateDateFormat
  images: {
    "redirect-ids": Record<string, ImageRedirect<`${string}\$${string}`>>,
    "redirected-images": Record<string, string|ImageRedirect<string>>,
    "words": Record<string, TextImage>
  },
  scenario: {
    days: string[],
    routes: Record<RouteName, Record<RouteDayName, string>>,
    scenes: typeof SCENE_ATTRS.scenes
  },
  credits: (TextImage & {delay?: number})[]
}

//______________________________private variables_______________________________
//------------------------------------------------------------------------------

const languagesStorage = new StoredJSON<LanguagesType>("languages", false)

const stringsStorage = new StoredJSON<StringsType>("strings", true)

const langSelection = {
  ready: false
}

//______________________________private functions_______________________________
//------------------------------------------------------------------------------

/**
 * Inserts the specified directory in strings that start with
 * a relative path mark ('./' or '../').
 * @param object object to modify
 * @param dir directory path to insert
 */
function insertDirectory(object: JSONObject, dir: string) {
  for (const key of Object.getOwnPropertyNames(object)) {
    const value = object[key]
    const valueType = value?.constructor
    if (valueType == String) {
      TSForceType<String>(value)
      if (value.startsWith('./')) {
        object[key] = dir + value.substring(1)
      }
      else if (value.startsWith('../'))
        object[key] = dir + '/' + value
    } else if (valueType == Object) {
      insertDirectory(value as JSONObject, dir)
    }
  }
  return object
}

async function loadTranslation(id: TranslationId): Promise<typeof strings> {
  if (!Object.hasOwn(languages, id))
    id = Object.getOwnPropertyNames(languages)[0] // fall back to first option if id does not exist

  const {dir, fallback, 'last-update': lastUpdate} = languages[id]
  const path = dir.startsWith("./") ? LANG_DIR + dir.substring(2) : dir
  const promise = Promise.all([
    fetchJson(`${path}/lang.json`).then(json => insertDirectory(json, dir)),
    fetchJson(`${path}/game.json`).then(json => insertDirectory(json, dir)),
  ])
  const result = fallback ? await loadTranslation(fallback) : {} as typeof strings

  result.id = id
  if (!Object.hasOwn(result, 'lastUpdate') || lastUpdate > result.lastUpdate)
    result.lastUpdate = lastUpdate

  const [lang, game] = await promise
  deepAssign(result, lang)
  deepAssign(result, game)
  return result
}

async function updateTranslation() {
  deepAssign(languages, await fetchJson(LANGUAGES_LIST_URL))
  languagesStorage.set(languages)
  let id: TranslationId | undefined = settings.language
  let lastUpdate = ""
  while (id) {
    const desc: LangDesc = languages[id]
    lastUpdate = desc["last-update"] > lastUpdate ? desc["last-update"] : lastUpdate
    id = desc.fallback
  }
  if (strings.lastUpdate && lastUpdate > strings.lastUpdate) {
    updateLanguage(settings.language, true)
  }
}

async function updateLanguage(id: TranslationId, forceUpdate = false) {
  if (!forceUpdate && Object.hasOwn(strings, 'id') && strings.id == id)
    return
  langSelection.ready = false
  deepAssign(strings, await loadTranslation(id), {clean: true})
  stringsStorage.set(strings)
  langSelection.ready = true
}

//##############################################################################
//#                                   PUBLIC                                   #
//##############################################################################

//_________________________________public types_________________________________
//------------------------------------------------------------------------------

export type ImageRedirect<format extends string> = {thumb:format, sd:format, hd: format}

export type TextImage = {
  bg?: string,
} & (
  { top: string|string[], center?: never, bottom?: never } |
  { center: string|string[], top?: never, bottom?: never } |
  { bottom: string|string[], top?: never, center?: never }
)

export type ResolutionId = 'thumb'|'sd'|'hd'
export type TrackSourceId = keyof typeof defaultStrings.audio['track-sources']

export type GameJson = Pick<StringsType, 'scenario'|'credits'>
export type LangJson = Omit<typeof defaultStrings, keyof GameJson>

export type TranslationId = string

//_______________________________public variables_______________________________
//------------------------------------------------------------------------------

export const languages = languagesStorage.get() || { } as LanguagesType
export const strings = stringsStorage.get() || { ...defaultStrings, id: "" } as StringsType

//_______________________________public functions_______________________________
//------------------------------------------------------------------------------

export async function waitLanguageLoad() {
  if (langSelection.ready)
    return
  else return new Promise(resolve=> {
    observe(langSelection, 'ready', resolve, {once: true})
  })
}

export function getLocale() {
  return languages[settings.language]?.locale ?? "en-US"
}

export function addLanguage(id: TranslationId, description: LangDesc) {
  languages[id] = description
  languagesStorage.set(languages)
}

//##############################################################################
//#                               ON-LOAD LOGIC                                #
//##############################################################################

if (!languagesStorage.exists()) {
  fetchJson(LANGUAGES_LIST_URL).then(json=> {
    deepAssign(languages, json)
    languagesStorage.set(languages)
  })
} else {
  updateTranslation() // update languages.json in the background
}
window.addEventListener('load', ()=> {
  observe(settings, 'language', updateLanguage)
  if (!Object.hasOwn(strings, 'id') || strings.id != settings.language)
    updateLanguage(settings.language)
  else {
    langSelection.ready = true
  }
})


window.strings = strings
// update strings when language changes and when window loads
