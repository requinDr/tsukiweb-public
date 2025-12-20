/**
 * Convert a script file into a folder of scenes in the format
 * used by the parser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'
import { parseScript } from '../../tsukiweb-common/tools/convert-scripts/parsers/kagScript.js';
import { CommandToken, LabelToken, StrReader, TextToken, Token } from '../../tsukiweb-common/tools/convert-scripts/parsers/utils.js'
import { logError, logProgress } from '../../tsukiweb-common/tools/utils/logging.js';
import { generateScenes, writeScenes } from './utils/nscriptr_convert.js';


const outputPathPrefix = '../../public/static/'
const outputDir = 'scenes'
const langs = [
  'jp',
  'en-mm',
  'es-tohnokun',
  'it-riffour',
  'pt-matsuri',
  'ko-wolhui',
  'ru-ciel',
  'zh-tw-yueji_yeren_hanhua_zu',
  'zh-yueji_yeren_hanhua_zu',
]
const files = {
  'pd_alliance'  : '幻視同盟.ks',
  'pd_geccha'    : 'げっちゃ.ks',
  'pd_geccha2'   : '真・弓塚夢想3.ks',
  'pd_experiment': 'きのこ名作実験場.ks'
}

//#endregion ###################################################################
//#region                      FILE-SPECIFIC FIXES
//##############################################################################

function insertPageBreak(tokens, targetLine, offset = 0) {
  const index = tokens.findIndex(t => t?.toString() === targetLine)
  if (index < 0) return

  const insertIndex = index + offset
  if (insertIndex > 0) {
    const previousToken = tokens[insertIndex - 1]
    if (previousToken instanceof TextToken && previousToken.text.endsWith('@')) {
      previousToken.text = previousToken.text.slice(0, -1)
      tokens.splice(insertIndex, 0, new CommandToken(0, '\\', []))
    }
  }
}

function insertDelay(tokens, targetLine, delay, offset = 0) {
  const index = tokens.findIndex(t => t?.toString() === targetLine)
  if (index < 0) return

  const insertIndex = index + offset
  if (insertIndex > 0) {
    tokens.splice(insertIndex, 0, new CommandToken(0, 'wait', [delay]))
  }
}

function replaceLine(tokens, targetLine, newLine, offset = 0) {
  const index = tokens.findIndex(t => t?.toString() === targetLine)
  if (index < 0) return

  tokens[index + offset] = new CommandToken(0, newLine, [])
}

function replaceAll(tokens, search, replace) {
  tokens.forEach((token, index) => {
    if (token instanceof CommandToken && token.cmd === 'ld') {
      const args = token.args
      if (args.length >= 2 && args[1] === search) {
        args[1] = replace
      }
    }
  })
}

const fixes = new Map(Object.entries({
  /**
   * 
   * @param {Token[]} tokens 
   */
  'pd_alliance': (tokens)=> {
    let i = tokens.findIndex(t=> t instanceof TextToken) + 1
    if (tokens[i] instanceof TextToken && 
      tokens[i].text.includes('[ruby text="つき"]月')) {
        tokens[i].text = '　[ruby text="つき"]月[ruby text="ひめ"]姫[ruby text="ほん"]本[ruby text="ぺん"]編のいずれかのエンディングに[ruby text="とう"]到[ruby text="たつ"]達した[ruby text="あと"]後に、[r]'
        tokens[i+1].text = '[ruby text="いき"]息[ruby text="ぬ"]抜きとして[ruby text="たの"]楽しんでください。'
      }

    insertPageBreak(tokens, '`  "[line=10]"@', -1)
  },
  'pd_geccha': (tokens)=> {
    insertPageBreak(tokens, 'ld l,"tachi/aki_t02b",notrans,0', -3)
    insertPageBreak(tokens, 'ld l,"tachi/his_t02",notrans,0', -6)
    insertPageBreak(tokens, 'ld l,"tachi/koha_t12",notrans,0')
    insertPageBreak(tokens, 'ld r,"tachi/koha_t14",notrans,0', 9)
    insertPageBreak(tokens, 'ld l,"tachi/koha_t16",notrans,0', -3)
  },
  'pd_geccha2': (tokens)=> {
    insertDelay(tokens, 'bg "bg/s12",lcartain,1000', 1500, 1)
    insertDelay(tokens, 'bg "bg/s13",tcartain,1000', 1500, 1)
    insertDelay(tokens, 'bg "bg/s14",lcartain,1000', 1500, 1)

    insertDelay(tokens, 'bg "bg/s08",lcartain,1000', 1500, 1)
    insertDelay(tokens, 'bg "bg/s09",bcartain,1000', 1500, 1)
    insertDelay(tokens, 'bg "bg/s10",lcartain,1000', 1500, 1)

    replaceLine(tokens, 'bg "bg/scroll19",tshutter,1000', 'bg "bg/scroll19",tshutter,1000,bottom')
    replaceLine(tokens, 'bg "bg/scroll19",bscroll,4000', 'bg "bg/scroll19",bscroll,4000,top')
    replaceLine(tokens, 'bg #ffffff,lexpl,4000', 'bg #ffffff,lexpl,4000,center')
  },
  'pd_experiment' : (tokens) => {
    insertPageBreak(tokens, 'ld c,"tachi/koha_t02",crossfade,400')
    replaceAll(tokens, '"tachi/nero_t02C"', '"tachi/nero_t02c"')
  },
}))

//#endregion ###################################################################
//#region                        GRAPHICS FIXES
//##############################################################################

const COLOR_IMAGES = new Map(Object.entries({
  'ima_10' : '#000000', 'black' : '#000000',
  'ima_11' : '#ffffff', 'white' : '#ffffff',
  'ima_11b': '#9c0120',
}))

const TRANSITION_RULES = new Map(Object.entries({
  'カーテン上から'    :'bcartain',//curtain from top
  'Curtainfromtop'   :'bcartain',
  'カーテン下から'    :'tcartain',//curtain from bottom
  'Curtainfrombottom':'tcartain',
  'カーテン右から'    :'lcartain',//curtain from right
  'Curtainfromright' :'lcartain',
  'カーテン左から'    :'rcartain',//curtain from left
  'Curtainfromleft'  :'rcartain',
  'シャッター上から'  :'bshutter',//TODO shutter from top
  'Shutterfromtop'  :'bshutter',
  'シャッター下から'  :'tshutter',//TODO shutter from bottom
  'Shutterfrombottom' :'tshutter',
  'シャッター左から'  :'rshutter',//TODO shutter from left
  'Shutterfromleft'  :'rshutter',
  '集中線2'           :'lexpl',   //TODO explosion on the left
  'Concentrateline2' :'lexpl',
  '円形(中から外へ・下)':'lcircle',//TODO circle left
  'Round(intoout_down)':'lcircle',
  '円形(中から外へ)'  :'ccircle', //TODO circle center
  'Round(intoout)'  :'ccircle',
}))

const SPRITE_POSITIONS = new Map(Object.entries({
  a: 'a', all : 'a', c: 'c', center: 'c',
  l: 'l', left: 'l', r: 'r', right : 'r',
}))

function processImgFile(args) {
  const file = args.get('file')
  if (COLOR_IMAGES.has(file))
    return COLOR_IMAGES.get(file)
  if (/^(志貴_|shiki_)/.test(file)) // 志貴_0[234]
    return `"tachi/shiki${file.replace(/^(志貴_|shiki_)/, "_")}"`
  if (/^(瀬尾_|seo_)/.test(file)) // 瀬尾_0[123]
    return `"tachi/akira${file.replace(/^(瀬尾_|seo_)/, "_")}"`
  if (file.match(/^[st]\d{2}$/)) {
    const c = file.charAt(0);
    const n = Number.parseInt(file.substring(1));
    // s01 .. s17 (name conflict with some waves -_-)
    // t01 .. t07
    return `"bg/${file}"`
  }
  if (file.match(/(aki|ark|cel|his|kemo|koha|neko|nero|roa|stk)_t?\d+[abc]?/)) {
    return `"tachi/${file}"`;
  }
  if (file.match(/fake_\d+/)) {
    return `"tachi/${file}"`;
  }
  if (file.match(/bg_(sp\d*|\d+[abcd]?)/)) {
    return `"bg/${file}"`;
  }
  if (file.match(/ima_\d+b?/)) {
    return `"bg/${file}"`
  }
  switch (file) {
    case 'fin' : case 'genshi' : case 'tea' : case 'one_a' : case 'one_b' :
    case 'two' : case 'three' : return `"word/pd_${file}"`;
    //'$b`[right]Fin[/right]`';
    //'$b`[right][u]   閑話/幻視同盟[/u][/right]`'; //Casual Talk / Illusionary Alliance
    //'$t`[u]          月茶[/u]`'; //Geccha
    //'$c`[center]一日目/1[/center]`'; //Day 1/1
    //'$c`[center]一日目/2[/center]`'; //Day 1/2
    //'$c`[center]二日目[/center]`'; //Day 2
    //'$c`[center]三日目[/center]`'; //Day 3
    case 'yumizuka' : return '"bg/yumizuka"';
    case 'スクロール19a' : return '"bg/scroll19"'; //TODO align bottom
    case 'スクロール19b' : return '"bg/scroll19"'; //TODO align top
    case 'scroll19a' : return '"bg/scroll19"'; //TODO align top
    case 'scroll19b' : return '"bg/scroll19"'; //TODO align top
    case 'matu'   : return `"bg/matu"`; //TODO full-screen sprite. Change ld to bg
    case 'next'   : return null; // used at the end of the scene (ignore)
    case 'title_01' : return '"bg/title_01"'; // used during script
    default : throw Error(`Unexpected image file ${file}`);
  }
}

function processImgTransition(args) {
  //TODO implement vague value
  let vague = args.get('vague') // width (in px) of the opacity gradient
  let rule = args.get('rule')
  let method = args.get('method')
  let time = +(args.get("time") ?? 0)
  if (time == 0)
    return 'notrans'
  if (!rule && !method)
    method = 'crossfade'
  if (method) {
    switch (method) {
      case 'crossfade' : case 'notrans' :
        break;
      case 'scroll' :
        switch (args.get('from')) {
          case 'top' : method = 'bscroll'; break //TODO implement
          case 'bottom' : method = 'tscroll'; break //TODO implement
          case 'left' : method = 'rscroll'; break //TODO implement
        }
        break;
      default :
        throw Error(`Unexpected transition method ${method}`)
    }
  } else {
    if (TRANSITION_RULES.has(rule))
      method = TRANSITION_RULES.get(rule)
    else
      throw Error(`Unexpected transition rule ${rule}`)
  }

  return method
}

function processSpritePos(args) {
  const pos = args.get('pos')
  if (SPRITE_POSITIONS.has(pos))
    return SPRITE_POSITIONS.get(pos)
  else
    throw new Error(`Unknown sprite pos ${pos}`)
}

function processBg(token, i, tokens) {
  let args = token.args
  let hideText = true
  switch (token.cmd) {
    case 'black' : args.set('file', 'black'); break
    case 'blackout' : args.set('file', 'black'); hideText = false; break
    case 'flushover' : args.set('file', 'white'); hideText = false; break
    case 'flash' : tokens[i] = null; return // only used once, no apparent effect
    case 'fadein' : hideText = false; break
  }
  const file = processImgFile(args)
  const transition = processImgTransition(args)
  const time = args.get('time') ?? 0
  token.cmd = 'bg'
  token.args = [file, transition, time]
  //TODO if (!hideText) keep text displayed
}

function processSprite(token) {
  switch (token.cmd) {
    case 'ld' : break //TODO
    case 'ld_auto' : break //TODO
    case 'ld_notrans' : break //TODO
    case 'cl' : break //hide text
    case 'cl_auto' : break //does not hide text
    case 'cl_notrans' : break // ?
  }
  const args = new Map(token.args)
  let transition = processImgTransition(args) || 'notrans'
  let pos = processSpritePos(args)
  let time = +(args.get('time') || 0)
  if (token.cmd.startsWith('ld')) {
    let file = processImgFile(args)
    token.cmd = 'ld'
    token.args = [pos, file, transition, time]
  } else {
    token.cmd = 'cl'
    token.args = [pos, transition, time]
  }
}

//#endregion ###################################################################
//#region                          AUDIO FIXES
//##############################################################################

function processTrack(token) {
  let args = token.args
  // TODO implement fadein/out time
  let file, time
  file = args.get('file') ?? args.get('storage')
  time = args.get('time') ?? args.get('overlap') ?? 0
  if (file) {
    if (!(file?.startsWith("TMCD-0101_")))
      throw Error(`Unexpected track name ${file}`)
    file = file.substring(file.length-2)
  }
  switch (token.cmd) {
    case 'play'     :
      token.args = [`"*${file}"`]
      break
    case 'xchgbgm'  : //TODO crossfade between tracks
      token.cmd = 'play'
      token.args = [`"*${file}"`]
      break
    case 'playstop' :
      token.args = []
      break
    default : throw Error(`Unexpected command ${token}`)
  }
}

function processWave(token) {
  // TODO implement fadein/out time for wavestop and waveloop
  let args = token.args
  const file = args.get('file')
  const time = args.get('time') ?? 0
  const nowait = args.get('nowait') == "true"
  if (token.cmd == 'wave' && !nowait)
    token.cmd = 'wave_wait'

  token.args = file ? [`pd/${file}`] : [] // cmd is unchanged
}

//#endregion ###################################################################
//#region                       OTHER CMDs FIXES
//##############################################################################

function processQuake(token, i, tokens) {
  let h = Number.parseInt(token.args.get('hmax') ?? '10')
  let v = Number.parseInt(token.args.get('vmax') ?? '10')
  let time = token.args.get('time')
  switch (token.cmd) {
    case 'quake' :
      if (h == 0) {
        token.cmd = 'quakey'
        token.args = [v, time]
      } else if (v == 0) {
        token.cmd = 'quakex'
        token.args = [h, time]
      } else {
        token.cmd = 'quakexy'
        token.args = [h, v, time]
      }
      break
    case 'wq' : // Always right after a quake. Depending on implementation,
      tokens[i] = null; // simply replace with a delay
      break
  }
}

function processRocket(token, i, tokens) {
  switch (token.cmd) {
    case 'rocket' :
      const args = token.args
      const arg_list = []
      
      const layer_mapping = {
        'right': 'r',
        'left': 'l',
        'center': 'c'
      }

      for (const [key, value] of args.entries()) {
        if (key === 'layer' && layer_mapping[value]) {
          arg_list.push(`${key}=${layer_mapping[value]}`)
        } else {
          arg_list.push(`${key}=${value}`)
        }
      }
      if (tokens[i+1] instanceof CommandToken && tokens[i+1].cmd != 'wrocket')
        arg_list.push("wait=false")
      
      token.cmd = 'rocket'
      token.args = [arg_list.join(' ')]
      break
    case 'wrocket' :
      tokens[i] = null
  }
}

function processPosition2(token) {
  token.cmd = 'textbox';
  token.args = ['adv'];
}

function processResetPosition2(token) {
  token.cmd = 'textbox';
  token.args = ['nvl'];
}

function discardToken(_token, i, tokens) {
  tokens[i] = null
}

const processPg = (token, i, tokens) => {
  const lastBreakIndex = tokens
    .slice(0, i)
    .findLastIndex(t => t instanceof CommandToken && t.cmd === '\\')

  const pageTokens = tokens.slice(lastBreakIndex + 1, i)
  // Check if there is any dialogue line in the page.
  const hasDialogue = pageTokens.some(t => t?.toString().startsWith('`'))

  hasDialogue ? token.cmd = '\\' : discardToken(token, i, tokens)
}

const CMD_MAP = new Map(Object.entries({
  'l'  : (t)=> t.cmd = '@',
  'r'  : (t)=> t.cmd = 'br',
  'pg' : processPg,
  'cm' : (t)=> t.cmd = '\\',
  'ct' : (t)=> t.cmd = '\\',
  'bg' : processBg,
  'fadein'     : processBg,
  'flash'      : (t)=> t.args = [t.args.get('time')],
  'black'      : processBg,
  'blackout'   : processBg,
  'flash'      : processBg,
  'flushover'  : processBg, // <=> fadein file=white
  'ld'         : processSprite,
  'ld_auto'    : processSprite,
  'ld_notrans' : processSprite,
  'cl'         : processSprite,
  'cl_auto'    : processSprite,
  'cl_notrans' : processSprite,
  'bgmopt'     : discardToken, // used only once to change music volume
  'play'       : processTrack,
  'playstop'   : processTrack,
  'xchgbgm'    : processTrack,
  'wave'       : processWave,
  'waveloop'   : processWave,
  'wavestop'   : processWave,
  'quake'      : processQuake,
  'wq'   : processQuake,
  'wait' : (t)=> {t.args= [t.args.get('time')]},
  'jump' : discardToken, // used to go to next scene
  'position'   : discardToken, // different call at the beginning of all 4 scenes. Must check consequence.
  'position2'  : processPosition2, // change text layer to adv mode
  'resetposition2' : processResetPosition2, // reset text layer to nvl mode
  'rocket'  : processRocket, // TODO see in-game effect (scenario/plugin/CVS/Base/RocketPlugin.ks)
  'wrocket' : processRocket, // idem
  'textoff' : discardToken, // can probably be ignored. Used around...
  'texton'  : discardToken, // ...img changes to hide and show the text.
}))

//#endregion ###################################################################
//#region                          TEXT FIXES
//##############################################################################

const INLINE_CMD_REGEX = /\[\w+([ \t]+[^\s=]+(\s*=\s*(\d+|[^\s\d"\]][^\s"\]]*|"[^\n"]*"))?)*\]/g
const INLINE_CMD_ARG_REGEXP = /(?<key>\w+)\s*=\s*(?<val>(\d+|[^\s\d"\]][^\s"\]]*|"[^\n"]*"))/g
const GLYPHS = new Map(Object.entries({
  'heart' : '♥',
}))

function processText(token, i, tokens) {
  const reader = new StrReader(token.text)
  let result = ""
  while (!reader.atEnd()) {
    const text = reader.readUntil(INLINE_CMD_REGEX, false)
    if (text.length > 0) {
      result += text
    }
    let command = reader.readMatch(INLINE_CMD_REGEX)
    if (command) {
      command = command.substring(1, command.length-1) // remove '[' and ']'
      let m = command.match(/^(?<cmd>\w+)(\s*|$)/)
      if (!m)
        throw Error(`Could not extract command from inline command ${command}`)
      const cmd = m.groups['cmd']
      const args = new Map()
      const argsString = command.substring(cmd.length)
      while ((m = INLINE_CMD_ARG_REGEXP.exec(argsString))) {
        if (INLINE_CMD_ARG_REGEXP.lastIndex )
        args.set(m.groups['key'], m.groups['val'])
      }
      switch (cmd) {
        case 'l' : return '@'
        case 'r' :
          break // ignore [r], all placed at end of line
        case 'graph' :
          const glyph = args.get('storage')
          if (!GLYPHS.has(glyph))
            throw Error(`Unknown glyph ${glyph}`)
          result += GLYPHS.get(glyph)
          break
        case 'ruby' :
          const rubyChars = args.get('char') ?? reader.read(1)
          const rubyTxt = args.get('text')
          result += `[ruby=${rubyTxt}]${rubyChars}[/ruby]`
          break
        case 'wrap' :
          break // ignore [wrap text="..."] commands used in english
        default :
          throw new Error(`Unexpected inline command ${command}`);
      }
    }
  }
  token.text = result.replaceAll(/[-―─―]{2,}/g, (match)=> `[line=${match.length}]`)
}

//#endregion ###################################################################
//#region                            MAIN
//##############################################################################

/**
 * @param {Token} token
 * @param {number} i
 * @param {Token[]} tokens
 */
function processToken(token, i, tokens) {
  if (token instanceof TextToken) {
    processText(token, i, tokens)
  } else if (token instanceof LabelToken) {
    tokens[i] = null //labels are always 'pageX' and always after @pg/@cm/@ct
  } else if (token instanceof CommandToken) {
    const cmd = token.cmd
    if (!CMD_MAP.has(cmd)) {
      throw Error(`Unknown command ${token}`)
    }
    CMD_MAP.get(cmd)(token, i, tokens)
  }
}


export function main() {
  const totalScripts = Object.keys(files).length * langs.length
  let processedCount = 0

  for (const folder of langs) {
    const input_dir = path.join(outputPathPrefix, folder)
    const output_dir = path.join(input_dir, outputDir)
    if (!fs.existsSync(output_dir)) {
      throw new Error(`Output directory does not exist: ${output_dir}`)
    }
    
    for (const [file, ks] of Object.entries(files)) {
      processedCount++
      logProgress(`Processing Plus-Disc scripts: (${processedCount}/${totalScripts}) ${folder}`)
      try {
        const fullPath = path.join(input_dir, ks)
        if (!fs.existsSync(fullPath)) {
          logError(`Input file not found: ${fullPath}`)
          continue
        }

        const txt = fs.readFileSync(fullPath, 'utf-8')
        const tokens = parseScript(txt)
        tokens.forEach(processToken)
        tokens.unshift(new LabelToken(0, file)) // prevent discard

        const fileContents = generateScenes(tokens, ()=> file, (map)=>{
          const tokens = map.get(file)
          tokens[0] = null
          if (tokens[1] instanceof CommandToken && tokens[1].cmd == '\\')
            tokens[1] = null
          if (fixes.has(file))
            fixes.get(file)(tokens)
        })
        writeScenes(output_dir, fileContents)
      } catch (e) {
        logError(`Error processing ${file} in ${folder}: ${e.message}`)
        continue
      }
    }
  }
  logProgress(`Processing Plus-Disc scripts: ${processedCount}/${totalScripts}\n`)
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  main()
}