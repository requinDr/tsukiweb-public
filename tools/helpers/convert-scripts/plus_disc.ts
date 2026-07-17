/**
 * Convert a script file into a folder of scenes in the format
 * used by the parser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'
import { parseScript } from '@tsukiweb/common/tools/convert-scripts/parsers/kagScript.ts';
import { Block, CommandToken, KagCommandToken, LabelToken, StrReader, TextToken, Token } from '@tsukiweb/common/tools/convert-scripts/parsers/utils.ts'
import { logger } from '@tsukiweb/common/tools/utils/logger.ts';
import { fixBlock, generateScenes, writeScenes } from './utils/nscriptr_convert.ts';


const outputPathPrefix = '../../../public/static/'
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

function insertPageBreak(block: Block, targetLine: string, offset = 0) {
  const index = block.indexOf(targetLine)
  if (index < 0) return

  const insertIndex = index + offset
  if (insertIndex > 0) {
    const previousToken = block.at(insertIndex - 1)
    if (previousToken instanceof TextToken && previousToken.text.endsWith('@')) {
      previousToken.text = previousToken.text.slice(0, -1)
      block.insert(insertIndex, '\\')
    }
  }
}

function deleteLine(block: Block, targetLine: string, offset = 0) {
  const index = block.findIndex(t => t.toString() === targetLine)
  if (index < 0) return
  block.delete(index + offset)
}

const fixes = new Map<string, (t: Block)=>void>(Object.entries({

  'pd_alliance': (block)=> {
    let i = block.findIndex(t=> t instanceof TextToken) + 1
    const t = block.at(i)
    if (t instanceof TextToken && t.text.includes('[ruby text="つき"]月')) {
        t.text = '　[ruby text="つき"]月[ruby text="ひめ"]姫[ruby text="ほん"]本[ruby text="ぺん"]編のいずれかのエンディングに[ruby text="とう"]到[ruby text="たつ"]達した[ruby text="あと"]後に、[r]';
        (block.at(i+1) as TextToken).text = '[ruby text="いき"]息[ruby text="ぬ"]抜きとして[ruby text="たの"]楽しんでください。'
    }
    let refIdx = block.findLastIndex(t=>t.toString().includes('ima_22'))
    refIdx = block.slice(0, refIdx).findLastIndex(t=>/\[line=10\].{1,2}@/.test(t.toString())) 
    block.insert(refIdx-1, '\\')
  },
  'pd_geccha': (block)=> {
    block.insert(block.indexOf('ld l,"tachi/aki_t02b",notrans,0')-3, '\\')
    block.insert(block.indexOf('ld l,"tachi/his_t02",notrans,0')-6, '\\')
    block.insert(block.indexOf('ld l,"tachi/koha_t12",notrans,0'), '\\')
    block.insert(block.indexOf('ld r,"tachi/koha_t14",notrans,0')+9, '\\')
    block.insert(block.indexOf('ld l,"tachi/koha_t16",notrans,0')-3, '\\')
  },
  'pd_geccha2': (block)=> {
    block.insert(block.indexOf('bg "bg/s12",lcartain,1000')+1, `wait 1500`)
    block.insert(block.indexOf('bg "bg/s13",tcartain,1000')+1, `wait 1500`)
    block.insert(block.indexOf('bg "bg/s14",lcartain,1000')+1, `wait 1500`)
    block.insert(block.indexOf('bg "bg/s08",lcartain,1000')+1, `wait 1500`)
    block.insert(block.indexOf('bg "bg/s09",bcartain,1000')+1, `wait 1500`)
    block.insert(block.indexOf('bg "bg/s10",lcartain,1000')+1, `wait 1500`)
    
 
    block.replaceText(/"bg\/scroll19",tshutter,1000(?!,)/, '$&,bottom', 1)
    block.replaceText(/"bg\/scroll19",bscroll,4000(?!,)/, '$&,top', 1)
    block.replaceText(/#ffffff,lexpl,4000(?!,)/, '$&,center', 1)
  },
  'pd_experiment' : (block) => {
    block.insert(block.indexOf('ld c,"tachi/koha_t02",crossfade,400'), '\\')
    block.replaceText("nero_t02C","nero_t02c")
    deleteLine(block, '`「なに、追いかけっこ？　志貴も好きだねー」')
  },
}))

function normalizePdScriptInput(txt: string) {
  // remove spaces on command lines
  return txt.replace(
    /^[ \t]+(?=@\w|\[[lr]+\]*\s*$)/gm,
    '',
  )
}

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

function processImgFile(args: Map<string, string>) {
  const file = args.get('file')!
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
    return `"tachi/${file.toLocaleLowerCase()}"`;
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

function processImgTransition(args: Map<string, string>) {
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
    if (TRANSITION_RULES.has(rule!))
      method = TRANSITION_RULES.get(rule!)
    else
      throw Error(`Unexpected transition rule ${rule}`)
  }

  return method
}

function processSpritePos(args: Map<string, string>) {
  const pos = args.get('pos')
  if (SPRITE_POSITIONS.has(pos!))
    return SPRITE_POSITIONS.get(pos!)
  else
    throw new Error(`Unknown sprite pos ${pos}`)
}

function processBg(token: KagCommandToken, i: number, block: Block) {
  let args = token.args as any as Map<string, string>
  let hideText = true
  switch (token.cmd) {
    case 'black' : args.set('file', 'black'); break
    case 'blackout' : args.set('file', 'black'); hideText = false; break
    case 'flushover' : args.set('file', 'white'); hideText = false; break
    case 'flash' : block.delete(i); return // only used once, no apparent effect
    case 'fadein' : hideText = false; break
  }
  const file = processImgFile(args)
  if (!file)
    block.delete(i)
  else {
    const transition = processImgTransition(args)
    const time = args.get('time') ?? '0'
    block.replace(i, 1, `bg ${file!},${transition!},${time}`)
  }
  //TODO if (!hideText) keep text displayed
}

function processSprite(token: KagCommandToken, i: number, block: Block) {
  switch (token.cmd) {
    case 'ld' : break //TODO
    case 'ld_auto' : break //TODO
    case 'ld_notrans' : break //TODO
    case 'cl' : break //hide text
    case 'cl_auto' : break //does not hide text
    case 'cl_notrans' : break // ?
  }
  const args = new Map(token.args as any as Map<string, string>)
  let transition = processImgTransition(args) || 'notrans'
  let pos = processSpritePos(args)
  let time = args.get('time') ?? '0'
  if (token.cmd.startsWith('ld')) {
    let file = processImgFile(args)
    block.replace(i, 1, `ld ${pos},${file},${transition},${time}`)
  } else {
    block.replace(i, 1, `cl ${pos},${transition},${time}`)
  }
}

//#endregion ###################################################################
//#region                          AUDIO FIXES
//##############################################################################

function processTrack(token: KagCommandToken, i: number, block: Block) {
  let args = token.args as any as Map<string, string>
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
    case 'xchgbgm'  : // TODO crossfade between tracks
    case 'play'     :
      block.replace(i, 1, `play "*${file}"`)
      break
    case 'playstop' :
      block.replace(i, 1, 'playstop')
      break
    default : throw Error(`Unexpected command ${token}`)
  }
}

function processWave(token: KagCommandToken, i: number, block: Block) {
  // TODO implement fadein/out time for wavestop and waveloop
  let args = token.args as any as Map<string, string>
  const file = args.get('file')
  const time = args.get('time') ?? 0
  const nowait = !(args.get('nowait') == "false")
  let cmd = token.cmd
  if (cmd == 'wave' && !nowait)
    cmd = 'wave_wait'
  block.replace(i, 1, new CommandToken(0, cmd, [`pd/${file}`]))
}

//#endregion ###################################################################
//#region                       OTHER CMDs FIXES
//##############################################################################

function processQuake(token: KagCommandToken, i: number, block: Block) {
  let h = (token.args as any as Map<string, string>).get('hmax') ?? '10'
  let v = (token.args as any as Map<string, string>).get('vmax') ?? '10'
  let time = (token.args as any as Map<string, string>).get('time')!
  switch (token.cmd) {
    case 'quake' :
      if (h == '0') {
        block.replace(i, 1, `quakey ${v},${time}`)
      } else if (v == '0') {
        block.replace(i, 1, `quakex ${h},${time}`)
      } else {
        block.replace(i, 1, `quakexy ${h},${v},${time}`)
      }
      break
    case 'wq' : // Always right after a quake. Depending on implementation,
      block.delete(i) // simply replace with a delay
      break
  }
}

function processRocket(token: KagCommandToken, i: number, block: Block) {
  switch (token.cmd) {
    case 'rocket' :
      const args = token.args as any as Map<string, string>
      const arg_list = []
      
      const layer_mapping = {
        'right': 'r',
        'left': 'l',
        'center': 'c'
      }

      for (const [key, value] of args.entries()) {
        if (key === 'layer' && layer_mapping[value as keyof typeof layer_mapping]) {
          arg_list.push(`${key}=${layer_mapping[value as keyof typeof layer_mapping]}`)
        } else {
          arg_list.push(`${key}=${value}`)
        }
      }
      const next = block.at(i+1)
      if (next instanceof KagCommandToken && next.cmd != 'wrocket')
        arg_list.push("wait=false")
      
      block.replace(i, 1, new CommandToken(0, 'rocket', [arg_list.join(' ')]))
      break
    case 'wrocket' :
      block.delete(i)
      break
  }
}

function discardToken(_token: Token, i: number, block: Block) {
  block.delete(i)
}

const processPg = (token: KagCommandToken, i: number, block: Block) => {
  const lastBreakIndex = block
    .slice(0, i)
    .findLastIndex(t => t instanceof CommandToken && t.cmd === '\\')

  const pageTokens = block.slice(lastBreakIndex + 1, i)
  // Check if there is any dialogue line in the page.
  const hasDialogue = pageTokens.some(t => t?.toString().startsWith('`'))
  if (hasDialogue)
    block.replace(i, 1, '\\')
  else
    block.delete(i)
}

const CMD_MAP = new Map<string, (token: KagCommandToken, i: number, block: Block)=>void>(Object.entries({
  'l'  : (_, i, block)=> block.replace(i, 1, '@'),
  'r'  : (_, i, block)=> block.replace(i, 1, 'br'),
  'pg' : processPg,
  'cm' : (_, i, block)=> block.replace(i, 1, '\\'),
  'ct' : (_, i, block)=> block.replace(i, 1, '\\'),
  'bg' : processBg,
  'fadein'     : processBg,
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
  'wait' : (t, i, block)=> block.replace(i, 1, `wait ${t.args.get('time')!}`),
  'jump' : discardToken, // used to go to next scene
  'position'   : discardToken, // different call at the beginning of all 4 scenes. Must check consequence.
  'position2'  : (_, i, block)=>block.replace(i, 1, 'textbox adv'), // change text layer to adv mode
  'resetposition2' : (_, i, block)=>block.replace(i, 1, 'textbox nvl'), // reset text layer to nvl mode
  'rocket'  : processRocket,
  'wrocket' : processRocket, // wait for rocket to finish. TODO Check if necessary
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

function processText(token: TextToken) {
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
      const cmd = m.groups!['cmd']
      const args = new Map()
      const argsString = command.substring(cmd.length)
      while ((m = INLINE_CMD_ARG_REGEXP.exec(argsString))) {
        if (INLINE_CMD_ARG_REGEXP.lastIndex )
        args.set(m.groups!['key'], m.groups!['val'])
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

function processToken(token: Token, i: number, block: Block) {
  if (token instanceof TextToken) {
    processText(token)
  } else if (token instanceof LabelToken) {
    block.delete(i) //labels are always 'pageX' and always after @pg/@cm/@ct
  } else if (token instanceof KagCommandToken) {
    const cmd = token.cmd
    if (!CMD_MAP.has(cmd)) {
      throw Error(`Unknown command ${token}`)
    }
    CMD_MAP.get(cmd)!(token, i, block)
  }
}


export function main() {
  const totalScripts = Object.keys(files).length * langs.length
  let processedCount = 0

  for (const folder of langs) {
    const input_dir = path.join(outputPathPrefix, folder)
    const output_dir = path.join(input_dir, outputDir)
    if (!fs.existsSync(output_dir)) {
      fs.mkdirSync(output_dir, { recursive: true })
    }
    
    for (const [file, ks] of Object.entries(files)) {
      processedCount++
      logger.progress(`Processing Plus-Disc scripts: (${processedCount}/${totalScripts}) ${folder}`)
      try {
        const fullPath = path.join(input_dir, ks)
        if (!fs.existsSync(fullPath)) {
          logger.error(`Input file not found: ${fullPath}`)
          continue
        }

        const txt = normalizePdScriptInput(fs.readFileSync(fullPath, 'utf-8'))
        let block = new Block(file, parseScript(txt))
        block.forEach(processToken)
        fixBlock(block, { blockFixes: [(block: Block)=> {
          block.delete(0) // remove added label
          const first = block.at(0)
          if (first instanceof CommandToken && first.cmd == '\\')
            block.delete(0)
          fixes.get(file)?.(block)
        }]})
        const fileContents = generateScenes(new Map([[file, block]]), ()=> (file))
        writeScenes(output_dir, fileContents)
      } catch (e) {
        logger.error(`Error processing ${file} in ${folder}: ${(e as Error).message}`)
        continue
      }
    }
  }
  logger.progress(`Processing Plus-Disc scripts: ${processedCount}/${totalScripts}\n`)
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  main()
}
