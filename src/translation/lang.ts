import { RouteName, RouteDayName } from "../types"
import defaultStrings from "../assets/lang/default.json"
import { SCENE_ATTRS } from "../utils/constants"
import { settings } from "../utils/settings"
import { observe } from "@tsukiweb-common/utils/Observer"
import { StoredJSON } from "@tsukiweb-common/utils/storage"
import { fetchJson, deepAssign, insertDirectory } from "@tsukiweb-common/utils/utils"
import { ImageRedirect, LangDesc, TextImage, TranslationId, UpdateDateFormat } from "@tsukiweb-common/utils/lang"

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
    "redirected-images": Record<string, string | ImageRedirect<string>>,
    "words": Record<string, string>
  },
  scenario: {
    days: string[],
    routes: Record<RouteName, Record<RouteDayName, string>>,
    scenes: typeof SCENE_ATTRS.scenes
  },
  credits: (TextImage & { delay?: number })[]
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

async function loadTranslation(id: TranslationId): Promise<typeof strings> {
  if (!Object.hasOwn(languages, id))
    id = Object.getOwnPropertyNames(languages)[0] // fall back to first option if id does not exist

  const { dir, fallback, 'last-update': lastUpdate } = languages[id]
  const path = dir.startsWith("./") ? LANG_DIR + dir.substring(2) : dir
  const promise = Promise.all([
    fetchJson(`${path}/lang.json`).then(json => insertDirectory(json, dir)),
    fetchJson(`${path}/game.json`).then(json => insertDirectory(json, dir)),
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

async function updateTranslations() {
  deepAssign(languages, await fetchJson(LANGUAGES_LIST_URL))
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
  deepAssign(strings, await loadTranslation(id), { clean: true })
  stringsStorage.set(strings)
  langSelection.ready = true
}

//##############################################################################
//#                                   PUBLIC                                   #
//##############################################################################

//_________________________________public types_________________________________
//------------------------------------------------------------------------------

export type TrackSourceId = keyof typeof defaultStrings.audio['track-sources']

export type GameJson = Pick<StringsType, 'scenario' | 'credits'>
export type LangJson = Omit<typeof defaultStrings, keyof GameJson>


//_______________________________public variables_______________________________
//------------------------------------------------------------------------------

export const languages = languagesStorage.get() || {} as LanguagesType
export const strings = stringsStorage.get() || { ...defaultStrings, id: "" } as StringsType

//_______________________________public functions_______________________________
//------------------------------------------------------------------------------

export function isLanguageLoaded() {
  return langSelection.ready;
}

export async function waitLanguageLoad() {
  if (langSelection.ready)
    return
  else return new Promise(resolve => {
    observe(langSelection, 'ready', resolve, { once: true })
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

let languagesLoaded = false
if (!languagesStorage.exists()) {
  const broswerLanguage = navigator.language;
  updateTranslations().then(() => {
    // Autodetect and switch languages based on browser language
    // This seems to be the best place
    if (broswerLanguage.startsWith("en"))  
      settings.language = 'en-mm'
    else if (broswerLanguage.startsWith("ja"))
      settings.language = 'jp'
    else if (broswerLanguage.startsWith("it"))
      settings.language = 'it-riffour'
    else if (broswerLanguage.startsWith("pt"))
      settings.language = 'pt-matsuri'
    else if (broswerLanguage.startsWith("es"))
      settings.language = 'es-tohnokun'
    else if (broswerLanguage.startsWith("ru"))
      settings.language = 'ru-ciel'
    else if (broswerLanguage == "zh-CN")
      settings.language = 'zh-yueji_yeren_hanhua_zu'
    else if (broswerLanguage == "zh-TW" || broswerLanguage == "zh-HK" || broswerLanguage == "zh-MO")
      settings.language = 'zh-tw-yueji_yeren_hanhua_zu'
    else if (broswerLanguage.startsWith("ko"))
      settings.language = 'ko-wolhui'
    else
      settings.language = 'en-mm'
    languagesLoaded = true
  })
} else {
  languagesLoaded = true
  updateTranslations() // update languages.json in the background
}

// update strings when language changes and when window loads

window.addEventListener('load', () => {
  observe(settings, 'language', updateLanguage)
  // 

  const broswerLanguage = navigator.language;
  if (languagesLoaded) {
    if (!Object.hasOwn(strings, 'id') || strings.id != settings.language)
      updateLanguage(settings.language)
    else

      langSelection.ready = true
  }
})


window.strings = strings