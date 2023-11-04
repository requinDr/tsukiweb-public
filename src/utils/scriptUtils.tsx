import { SceneName } from "../types";
import { SCENE_ATTRS } from "./constants";
import strings, { credits, scenesDir, waitLanguageLoad } from "./lang";
import { subTextCount } from "./utils";
import { getGameVariable } from "./variables";

//##############################################################################
//#                           FETCH SCENES / BLOCKS                            #
//##############################################################################

const LOGIC_FILE = 'scene0.txt';
/*
 * Fetch and split the script into lines
 */

export function creditsScript(insertEndOfPlay: boolean = false): string[] {
  return [
    'play "*10"',
    'bg #000000,%type_crossfade_fst',
    ...(credits().map(([text, delay])=> {
      const delayCmd = `delay ${delay}`
      if (!text)
        return delayCmd
      const textCmd = `bg ${text},%type_crossfade_mid`
      return [textCmd, delayCmd]
    }).flat()),
    'bg #000000,%type_crossfade_slw',
    ...(insertEndOfPlay ? ["goto *endofplay"] : [])
  ]
}

export async function fetchScene(sceneId: string): Promise<string[] | undefined> {
  await waitLanguageLoad()
  if (/^s\d+a?$/.test(sceneId))
    sceneId = `scene${sceneId.substring(1)}`;
  else if (sceneId == "ending") {
    return await creditsScript(true)
  }
  const script = await fetch(`${scenesDir()}/${sceneId}.txt`).then(
    (response) => response.ok ? response.text() : undefined,
    (_failErr) => undefined);

  //split data on \n
  const result = script?.split(/\r?\n/).filter(line => line.length > 0);

  return result;
}

async function fetchBlock(label: string): Promise<string[]> {
  await waitLanguageLoad()
  const script = await fetch(`${scenesDir()}/${LOGIC_FILE}`).then(
    (response) => response.text());

  let start = script.search(new RegExp(`^\\*${label}\\b`, "m"));
  if (start == -1)
    return [];
  start = script.indexOf('\n', start + 1) + 1;
  
  let endRegexp = new RegExp(`^\\*(?!skip)(?!${label}_\\d)`, 'm')
  let end = script.substring(start).search(endRegexp);
  end = (end == -1) ? script.length : start + end;

  return script.substring(start, end)
    .split(/\r?\n/)
    .filter(line => line.length > 0 && !line.startsWith('*'));
}
const ignoredFBlockLines = [
  "gosub *regard_update",
  "!sd"
];
const osieteRE = /[`"][^`"]+[`"],\s*(?<label>\*f5\d{2}),\s*[`"][^`"]+[`"],\s*\*endofplay/
export async function fetchFBlock(label: string): Promise<string[]> {
  const afterScene = /^skip\d+a?$/.test(label);
  if (afterScene) {
    // extract block label from skip label after 'skip'
    label = `f${label.substring(4)}`;
  }
  const lines = (await fetchBlock(label)).filter(
    line => !ignoredFBlockLines.includes(line));

  // find 'gosub *sXXX'
  let sceneLine = lines.findIndex(line => /^gosub\s+\*s\d/.test(line));
  if (sceneLine >= 0) {
    // remove scene skip code
    const skipEnd = lines.indexOf("return") + 1;
    if (afterScene)
      lines.splice(0, skipEnd);
    else {
      lines.splice(sceneLine - 1, skipEnd - sceneLine + 1, lines[sceneLine]);
      sceneLine--;
    }
  }
  // concatenate choices
  let choiceLine = lines.findIndex(line => line.startsWith('select'));
  if (choiceLine >= 0) {
    const choices = lines.slice(choiceLine).map(line => line.trim()).join(' ');
    lines.splice(choiceLine);
    lines.push(choices);
    let osieteMatch = osieteRE.exec(choices)
    if (osieteMatch && osieteMatch.groups?.["label"])
      lines.splice(choiceLine, 1, `osiete ${osieteMatch.groups.label}`)
  }
  //remove remaining text lines
  return lines.filter(l=>!isTextLine(l));
}

//##############################################################################
//#                     SCRIPT PROCESSING HELPER FUNCTIONS                     #
//##############################################################################

export function isScene(label: string): boolean {
  return /^\*?s\d+a?$/.test(label) || ["openning", "ending", "eclipse"].includes(label)
}

export function getSceneTitle(label: SceneName): string|undefined {
  const attrs = strings.scenario.scenes[label] ?? SCENE_ATTRS.scenes[label]
  
  if (!attrs)
    return undefined
  if ("title" in attrs)
    return attrs.title
  else {
    const {r, d, s} = attrs
    let route: keyof typeof strings.scenario.routes
    if (typeof r == "object" && 'flg' in r)
      route = r[(getGameVariable(`%flg${r.flg}`)) ? "1" : "0"]
    else
      route = r

    let sceneName = strings.scenario.routes[route][d]
    if (s) {
      sceneName += " - "
      if (typeof s == "object" && 'flg' in s)
        sceneName += s[(getGameVariable(`%flg${s.flg}`)) ? "1" : "0"]
      else
        sceneName += s
    }
    return sceneName
  }
}

// (%var|n)(op)(%var|n)
const opRegexp = /(?<lhs>(%\w+|\d+))(?<op>[=!><]+)(?<rhs>(%\w+|\d+))/
export function checkIfCondition(condition: string) {
  let value = true
  for (const [i, token] of condition.split(' ').entries()) {
    if (i % 2 == 0) {
      const match = opRegexp.exec(token)
      if (!match) throw Error(
        `Unable to parse expression "${token}" in condition ${condition}`)

      let {lhs: _lhs, op, rhs: _rhs} = match.groups as any
      const lhs = _lhs.startsWith("%")? getGameVariable(_lhs) : parseInt(_lhs)
      const rhs = _rhs.startsWith("%")? getGameVariable(_rhs) : parseInt(_rhs)

      switch (op) {
        case '==' : value = (lhs == rhs); break
        case '!=' : value = (lhs != rhs); break
        case '<'  : value = (lhs <  rhs); break
        case '>'  : value = (lhs >  rhs); break
        case '<=' : value = (lhs <= rhs); break
        case '>=' : value = (lhs >= rhs); break
        default : throw Error (
          `unknown operator ${op} in condition ${condition}`)
      }
    } else {
      switch (token) {
        case "&&" : if (!value) return false; break
        case "||" : if (value) return true; break
        default : throw Error(
          `Unable to parse operator "${token}" in condition ${condition}`)
      }
    }
  }
  return value
}

function splitText(text: string) {
  const instructions = new Array<{ cmd:string, arg:string }>()
  let index = 0
  // replace spaces with en-spaces at the beginning of the line
  while (text.charCodeAt(index) == 0x20)
    index++
  text = "\u2002".repeat(index) + text.substring(index)
  // split tokens at every '@', '\', '!xxx'
  while (text.length > 0) {
    index = text.search(/@|\\|!\w|$/)
    if (index > 0)
      instructions.push({cmd:'`',arg: text.substring(0, index)})
    text = text.substring(index)
    switch (text.charAt(0)) {
      case '@' :
      case '\\' :
        instructions.push({cmd: text.charAt(0), arg:""})
        text = text.substring(1)
        break
      case '!' : // !w<time>
        const argIndex = text.search(/\d|\s|$/)
        const endIndex = text.search(/\s|$/)
        instructions.push({
          cmd: text.substring(0, argIndex),
          arg: text.substring(argIndex, endIndex)})
        text = text.substring(endIndex)
        break
    }
  }
  return instructions
}
const textLineRegexp = /^[`\-―─\[「『\s]/
export const isTextLine = textLineRegexp.test.bind(textLineRegexp)

export function extractInstructions(line: string) {
  const instructions = new Array<{cmd:string,arg:string}>()
  line = line.trimEnd()
  const endPageBreak = line.endsWith('\\') && line.length > 1

  if (endPageBreak) // '\\' will be added as an individual command at the end
    line = line.substring(0, line.length-1)
  
  if (isTextLine(line)) {
    if (line.startsWith('`')) {
      line = line.substring(1)
      if (!endPageBreak)
          line += '\n'
    } else if (!endPageBreak)
      line += '@\n'
    instructions.push(...splitText(line))
  } else if (line.startsWith('!')) {
    instructions.push(...splitText(line)) // '!w' are handled as inline commands
  } else if (line.startsWith('#')) {
    instructions.push({ cmd: 'textcolor', arg: line })
  } else {
    //remove comments (text after ';' outside "")
    let commentIdx = -1
    do {
      commentIdx = line.indexOf(';', commentIdx+1)
    } while (commentIdx >= 0 && subTextCount(line.substring(0, commentIdx), '"') % 2 == 1)
    if (commentIdx >= 0)
      line = line.substring(0, commentIdx)

    let index = line.search(/\s|$/)
    instructions.push({
      cmd: line.substring(0,index),
      arg: line.substring(index+1)
    })
  }

  if (endPageBreak)
    instructions.push({cmd:'\\',arg:''})

  return instructions
}
