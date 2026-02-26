import { fetchBlockLines, getPageAtLine, isScene } from "script/utils";
import { PartialRecord } from "@tsukiweb-common/types"
import { versionsCompare } from "@tsukiweb-common/utils/utils"
import { Regard } from "script/ScriptPlayer"
import { LabelName, RouteDayName, RouteName } from "types"
import { APP_VERSION } from "./constants";
import { SaveState } from "./savestates";

export async function updateSave(ss: SaveState): Promise<SaveState> {
  const version = ss.version ?? '0.3.6' // last version without a 'version' attribute
  if (versionsCompare(ss.version, "0.4.0") < 0) {
    ss = await v0_4_0_updateSave(ss)
  }
  if (versionsCompare(ss.version, "0.5.0") < 0) {
    ss = await v0_5_0_updateSave(ss)
  }
  if (versionsCompare(ss.version, "0.6.0") < 0) {
    ss = v0_6_0_updateSave(ss)
  }
  return ss
}

//#endregion ###################################################################
//#region                         < v0.4.0 UPDATE
//##############################################################################

type OldRegard = PartialRecord<'ark'|'ciel'|'akiha'|'kohaku'|'hisui', number>
function regard_update(regard: OldRegard): Regard {
  return {
    ark : regard.ark    ?? 0,
    cel : regard.ciel   ?? 0,
    aki : regard.akiha  ?? 0,
    koha: regard.kohaku ?? 0,
    his : regard.hisui  ?? 0,
  }
}

function phase_update(phase: Record<string, string|number>|undefined) {
  let route, routeDay, day
  if (phase) {
    route = phase.route
    routeDay = phase.routeDay
    day = phase.day
    if (routeDay == "") {
      routeDay = day
      day = 0
    }
  } else {
    // use default values. SaveItem should use scene title if available
    route = 'others'
    routeDay = 'pro'
    day = 0
  }
  return {
    route   : route    as RouteName,
    routeDay: routeDay as RouteDayName,
    day     : day      as RouteDayName<'others'> | number
  }
}

async function v0_4_0_updateSave(ss: SaveState): Promise<SaveState> {
  if (!Object.hasOwn(ss, 'context')) { // Fix errors with previous saves
    return {                           // getting updated without the change
      ...ss,                           // of version number. Added 2025-09-08
      version: "0.4.0"
    }
  }
  const {context, progress, page, graphics} = ss as any
  const pageNum = isScene(context.label) ?
    getPageAtLine(await fetchBlockLines(context.label), context.index)
    : 0
  return {
    scenes: [{
      label: context.label,
      flags: progress.flags ?? [],
      regard: regard_update(progress.regard ?? {})
    }],
    pages: [{
      label: context.label,
      page: pageNum,
      text: page.text ?? "",
      textPrefix: page.textPrefix ?? "",
      textBox: page.textBox ?? "nvl",
      audio: context.audio ?? {},
      graphics: context.graphics ?? {},
      phase: phase_update(context.phase),
      ...(page.contentType == "text" ? { type: "text" }
        : page.contentType == "skip" ? { type: "skip" }
        : page.contentType == "phase" ? { type: "phase" }
        : { type: "choice",
          choices: page.choices,
          selected: page.selected
        }
      )
    }],
    graphics: graphics,
    date: ss.date,
    version: APP_VERSION
  }
}
//#endregion ###################################################################
//#region                         < v0.5.0 UPDATE
//##############################################################################

async function v0_5_0_updateSave(ss: SaveState): Promise<SaveState> {
  const { pages, scenes } = ss

  ss.version = "0.5.0"
	const mergedScenes = {
		's23' : ['s22', 35],
		's24' : ['s21', 36],
		's58' : ['s57', 64],
		's59' : ['s57', 64],
	}
  let s, i
  
  if ((i = scenes.findIndex(s=>s.label == 's23')) >= 0)
    (i == 0)? scenes[i]!.label = 's22' : scenes.splice(i, 1)
  if ((i = scenes.findIndex(s=>s.label == 's24')) >= 0)
    (i == 0)? scenes[i]!.label = 's23' : scenes.splice(i, 1)
  if (s = scenes.find(s=>s.label == 's47')) s.label = 's46'
  if (s = scenes.find(s=>s.label == 's37')) s.label = 's201'
  if ((i = scenes.findIndex(s=>s.label == 's58')) >= 0)
    (i == 0) ? scenes[i]!.label = 's57' : scenes.splice(i, 1)
  if ((i = scenes.findIndex(s=>s.label == 's59')) >= 0)
    (i == 0) ? scenes[i]!.label = 's57' : scenes.splice(i, 1)
  if (s = scenes.find(s=>s.label == 's60')) s.label = 's62'
  if (s = scenes.find(s=>s.label == 's61')) s.label = 's63'

  for (const [j, p] of pages.entries()) {
    if (p.label && Object.hasOwn(mergedScenes, p.label)) {
      const [prevLabel, defaultPage] = mergedScenes[p.label as keyof typeof mergedScenes]
        // if possible, calculate correct page number using last page of previous scene
        i = j-1
        while (i >= 0 && pages[i].label == p.label)
          i--
        if (pages[i].label == prevLabel)
          p.page = (pages[i].page ?? 0) + (j-i)
        // otherwise, use english version page count
        else
          p.page = (p.page ?? 0) + (defaultPage as number)
        p.label = prevLabel as LabelName
    }
    else switch (p.label) {
      case 's37' : p.label = 's201'; break
      case 's47' : p.label = 's46'; break
      case 'f117' : p.label = 'skip116a'; break
      case 'skip23' : p.label = 'skip22'; break
      case 'skip24' : p.label = 'skip21'; break
      case 'skip37' : p.label = 'skip201'; break
    }
  }
  
  // if s40 not finished yet, and coming from s201, decrement %regard_aki
  if (pages?.at(-1)?.label == 's40' && scenes.find(s=>s.label == 's201')
      && scenes.at(-1)!.regard!.aki)
    scenes.at(-1)!.regard!.aki!-- // "inc %regard_aki" moved from f38 to skip40
  
  return ss
}
//#endregion ###################################################################
//#region                         < v0.6.0 UPDATE
//##############################################################################

function v0_6_0_updateSave(ss: SaveState): SaveState {
  ss.version = "0.6.0"
  const mergedImages: Record<string, string> = {
    "event/cel_e06a": "event/cel_e06",
    "event/cel_e06b": "event/cel_e06",
    "event/koha_h06a": "event/koha_h06",
    "event/koha_h06b": "event/koha_h06",
  }

  // Update graphics in pages
  for (const page of ss.pages ?? []) {
    if (page.graphics) {
      for (const [key, value] of Object.entries(page.graphics)) {
        if (value && mergedImages[value]) {
          (page.graphics as Record<string, string>)[key] = mergedImages[value]
        }
      }
    }
  }

  // Update top-level graphics if present
  if (ss.graphics) {
    for (const [key, value] of Object.entries(ss.graphics)) {
      if (value && mergedImages[value]) {
        (ss.graphics as Record<string, string>)[key] = mergedImages[value]
      }
    }
  }

  return ss
}