import defaultStrings from "../assets/lang/default.json"
import { settings } from "../engine/settings"
import { observe } from "@tsukiweb-common/utils/Observer"
import { ValueStorage } from "@tsukiweb-common/utils/storage"
import { fetchJson, deepAssign, insertDirectory } from "@tsukiweb-common/utils/utils"
import { ImageRedirect, LangDesc, LanguagesType, pickDefaultTranslation, ResolutionId, TextImage, TranslationId, UpdateDateFormat } from "@tsukiweb-common/utils/lang"
import { langSelection } from "./langSelection"
import { PartialRecord } from "@tsukiweb-common/types"
import { APP_VERSION, SCENE_ATTRS } from "app/utils/constants";
import { LabelName, RouteDayName, RouteName } from "app/utils/types";

//##############################################################################
//#                                  PRIVATE                                   #
//##############################################################################

//______________________________private constants_______________________________
//------------------------------------------------------------------------------

const LANG_DIR = `${import.meta.env.BASE_URL}static/`
const LANG_LIST = `${LANG_DIR}languages.json`

//________________________________private types_________________________________
//------------------------------------------------------------------------------

type StringsTypeBase = {
  id: TranslationId
  lastUpdate: UpdateDateFormat
  images: {
    "redirect-ids": Record<string, ImageRedirect<`${string}\$${string}`>>
    "redirected-images": Record<string, string|ImageRedirect<string>>
    "words": Record<string, string>
  } & Record<ResolutionId, Record<string, string>>
  choices: PartialRecord<LabelName, string[]>
  scenario: {
    days: string[]
    routes: Record<RouteName, Record<RouteDayName, string>>
    scenes: typeof SCENE_ATTRS.scenes
  }
  credits: (TextImage & {delay?: number})[]
}
type StringsType = StringsTypeBase & Omit<typeof defaultStrings, keyof StringsTypeBase>

//______________________________private variables_______________________________
//------------------------------------------------------------------------------

const languagesStorage = new ValueStorage<LanguagesType>("languages", false, JSON.stringify, JSON.parse)
const stringsStorage = new ValueStorage<StringsType>("strings", true, JSON.stringify, JSON.parse)

//______________________________private functions_______________________________
//------------------------------------------------------------------------------

async function loadTranslation(id: TranslationId): Promise<StringsType> {
  if (!Object.hasOwn(languages, id))
    id = Object.getOwnPropertyNames(languages)[0] // fall back to first option if id does not exist

  const {dir, fallback, 'last-update': lastUpdate} = languages[id]
  const path = dir.startsWith("./") ? LANG_DIR + dir.substring(2) : dir

  const [lang, game] = await Promise.all([
    fetchJson(`${path}/lang.json?v=${APP_VERSION}`).then(json => insertDirectory(json, dir)),
    fetchJson(`${path}/game.json?v=${APP_VERSION}`).then(json => insertDirectory(json, dir)),
  ])

  // Check if the translation has everything from defaultStrings
  const merged = deepAssign(deepAssign({} as any, lang), game)
  const needsFallback = fallback && !coversAllKeys(merged, defaultStrings)

  const result = needsFallback
    ? await loadTranslation(fallback)
    : { ...defaultStrings } as unknown as StringsType

  result.id = id
  if (!Object.hasOwn(result, 'lastUpdate') || lastUpdate > result.lastUpdate)
    result.lastUpdate = lastUpdate

  deepAssign(result, lang)
  deepAssign(result, game)
  return result
}

const OPTIONAL_TRANSLATION_PATHS = new Set([
  "images.words",
  "images.thumb",
  "images.thumb.",
  "images.src.",
  "audio",
])

function coversAllKeys(source: object, reference: object, path = ""): boolean {
  for (const [key, refVal] of Object.entries(reference)) {
    const fullPath = path ? `${path}.${key}` : key
    if (OPTIONAL_TRANSLATION_PATHS.has(fullPath)) continue
    if (!Object.hasOwn(source, key)) {
      console.debug(`missing key: ${fullPath}`)
      return false
    }
    if (refVal !== null && typeof refVal === 'object' && !Array.isArray(refVal)) {
      const srcVal = (source as Record<string, unknown>)[key]
      if (typeof srcVal !== 'object' || !coversAllKeys(srcVal as object, refVal, fullPath))
        return false
    }
  }
  return true
}

async function fetchAvailableLanguages() {
  deepAssign(languages, await fetchJson(`${LANG_LIST}?v=${APP_VERSION}`))
  languagesStorage.set(languages)
  setDefaultlanguage()
  let id: TranslationId | undefined = settings.language
  let lastUpdate = ""
  while (id) {
    const desc: LangDesc = languages[id]
    lastUpdate = desc["last-update"] > lastUpdate ? desc["last-update"] : lastUpdate
    id = desc.fallback
  }
  if (strings.id != id || !strings.lastUpdate || lastUpdate > strings.lastUpdate) {
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

function setDefaultlanguage() {
  if (settings.language == "default") {
    // pick the language that best matches the browser's locales, default to english
    settings.language = pickDefaultTranslation(languages, [...navigator.languages, "en"])
  }
}

//##############################################################################
//#                                   PUBLIC                                   #
//##############################################################################

export type TrackSourceId = keyof typeof defaultStrings.audio['tracks']

export const languages = languagesStorage.get() || { } as LanguagesType
export const strings = stringsStorage.get() || { ...defaultStrings, id: "" } as any as StringsType

export function getLocale() {
  return languages[settings.language]?.locale ?? "en-US"
}

//##############################################################################
//#                               ON-LOAD LOGIC                                #
//##############################################################################

async function initTranslations() {
  if (!languagesStorage.storageExists()) {
    await fetchAvailableLanguages()
  } else {
    fetchAvailableLanguages() // update languages.json in the background
  }
  
  if (!Object.hasOwn(strings, 'id') || strings.id !== settings.language) {
    await updateLanguage(settings.language)
  } else {
    langSelection.ready = true
  }
}

// update strings when language changes and when window loads
observe(settings, 'language', (lang)=>updateLanguage(lang))
window.addEventListener('load', initTranslations)

window.strings = strings
