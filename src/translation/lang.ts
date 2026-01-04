import { RouteName, RouteDayName, LabelName } from "../types"
import defaultStrings from "../assets/lang/default.json"
import { APP_VERSION, SCENE_ATTRS } from "../utils/constants"
import { settings } from "../utils/settings"
import { observe } from "@tsukiweb-common/utils/Observer"
import { ValueStorage } from "@tsukiweb-common/utils/storage"
import { fetchJson, deepAssign, insertDirectory } from "@tsukiweb-common/utils/utils"
import { ImageRedirect, LangDesc, TextImage, TranslationId, UpdateDateFormat } from "@tsukiweb-common/utils/lang"
import { langSelection } from "./langSelection"
import { PartialRecord } from "@tsukiweb-common/types"

//##############################################################################
//#                                  PRIVATE                                   #
//##############################################################################

//______________________________private constants_______________________________
//------------------------------------------------------------------------------

const LANG_DIR = `${import.meta.env.BASE_URL}static/`
const LANGUAGES_LIST_URL = `${LANG_DIR}languages.json`


//________________________________private types_________________________________
//------------------------------------------------------------------------------

type LanguagesType = Record<TranslationId, LangDesc>

type StringsType = typeof defaultStrings & {
  id: TranslationId,
  lastUpdate: UpdateDateFormat
  images: {
    "redirect-ids": Record<string, ImageRedirect<`${string}\$${string}`>>,
    "redirected-images": Record<string, string|ImageRedirect<string>>,
    "words": Record<string, string>
  },
  choices: PartialRecord<LabelName, string[]>,
  scenario: {
    days: string[],
    routes: Record<RouteName, Record<RouteDayName, string>>,
    scenes: typeof SCENE_ATTRS.scenes
  },
  credits: (TextImage & {delay?: number})[]
}


//______________________________private variables_______________________________
//------------------------------------------------------------------------------

const languagesStorage = new ValueStorage<LanguagesType>("languages", false, JSON.stringify, JSON.parse)
const stringsStorage = new ValueStorage<StringsType>("strings", true, JSON.stringify, JSON.parse)


//______________________________private functions_______________________________
//------------------------------------------------------------------------------

async function loadTranslation(id: TranslationId): Promise<typeof strings> {
  if (!Object.hasOwn(languages, id))
    id = Object.getOwnPropertyNames(languages)[0] // fall back to first option if id does not exist

  const {dir, fallback, 'last-update': lastUpdate} = languages[id]
  const path = dir.startsWith("./") ? LANG_DIR + dir.substring(2) : dir
  const promise = Promise.all([
    fetchJson(`${path}/lang.json?v=${APP_VERSION}`).then(json => insertDirectory(json, dir)),
    fetchJson(`${path}/game.json?v=${APP_VERSION}`).then(json => insertDirectory(json, dir)),
  ])
  const result = fallback ? await loadTranslation(fallback) : {} as StringsType

  result.id = id
  if (!Object.hasOwn(result, 'lastUpdate') || lastUpdate > result.lastUpdate)
    result.lastUpdate = lastUpdate

  const [lang, game] = await promise
  deepAssign(result, lang)
  deepAssign(result, game)
  return result
}

async function fetchAvailableLanguages() {
  deepAssign(languages, await fetchJson(`${LANGUAGES_LIST_URL}?v=${APP_VERSION}`))
  languagesStorage.set(languages)
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
  setDefaultlanguage()
}

function setDefaultlanguage() {
  // If no locale storage for settings and savestates (=> the user has not
  // really played the game yet), then set the language to the closest one to
  // the browser languages
  if (!localStorage.getItem('settings') && !localStorage.getItem('savestates')) {
    const langEntries = Object.entries(languages)
    let index = -1
    for (let locale of navigator.languages) {
      index = langEntries.findIndex(([_, lang])=> lang.locale == locale)
      if (index != -1)
        break
    }
    if (index != -1)
      settings.language = langEntries[index][0]
  }
}


//##############################################################################
//#                                   PUBLIC                                   #
//##############################################################################

//_________________________________public types_________________________________

export type TrackSourceId = keyof typeof defaultStrings.audio['tracks-path']
export type GameJson = Pick<StringsType, 'scenario'|'credits'|'choices'>
export type LangJson = Omit<typeof defaultStrings, keyof GameJson>


//_______________________________public variables_______________________________
//------------------------------------------------------------------------------

export const languages = languagesStorage.get() || { } as LanguagesType
export const strings = stringsStorage.get() || { ...defaultStrings, id: "" } as StringsType


//_______________________________public functions_______________________________
//------------------------------------------------------------------------------

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
