
import fs from 'fs';
import path from 'path';
import { parseScript } from "../../../../tsukiweb-common/tools/convert-scripts/parsers/nscriptr.ts";
import { Token, CommandToken, TextToken, ConditionToken, LabelToken, ErrorToken, Block } from "../../../../tsukiweb-common/tools/convert-scripts/parsers/utils.ts"

//##############################################################################
//#region                       GENERIC FIXES
//##############################################################################

const durations = new Map(Object.entries({'fst': 400, 'mid': 800, 'slw': 1500}))

function simplifyImage(image: string) {
    return image.replaceAll('\\', '/')
                .replace(/^"(:a;)?image\//, '"')
                .replace(/.(jpg|png)"$/, '"')
}

function formatGraphics(token: CommandToken) {
    
    // Extract arguments
    let pos, image, effect
    switch (token.cmd) {
        case 'bg':
            if (token.args.length > 2)
                return // already formatted
            pos = 'bg';
            [image, effect] = token.args
            break
        case 'ld':
            if (token.args.length > 3)
                return // already formatted    
            [pos, image, effect] = token.args
            break
        case 'cl':
            if (token.args.length > 2)
                return //already formatted
            image = '';
            [pos, effect] = token.args
            break
    }

    // Clean and divide effect into type and duration
    if (effect!.startsWith('%type_'))
        effect = effect!.substring('%type_'.length)
    let i = effect!.lastIndexOf('_')
    let time = 0
    if (i >= 0) {
        const speed = effect!.substring(i+1)
        effect = effect!.substring(0, i)
        if (isNaN(+speed))
            time = durations.get(speed)!
        else
            time = +speed
        if (!time)
            throw Error(`Ill-formed effect: ${token}`)
    } else if (!(/^(crossfade|(no)?waitdisp|[rltb](shutter|cartain|maskcross|scroll))/.test(effect!))){
        throw Error(`Ill-formed effect: ${token}`)
    } else {
        time = 0
    }
    
    if (["waitdisp", "nowaitdisp"].includes(effect as string))
        effect = "notrans"

    // Simplify image name
    image = simplifyImage(image!)
    
    //if (COLOR_IMAGES.has(image))
    //    image = COLOR_IMAGES.get(image)
    switch(token.cmd) {
        case 'bg' : token.args = [image, effect!, time.toString()]; break
        case 'ld' : token.args = [pos!, image, effect!, time.toString()]; break
        case 'cl' : token.args = [pos!, effect!, time.toString()]; break
    }
}

function adjustSkips(block: Block) {
    for (let [token, i] of block) {
        if (token instanceof ConditionToken)
            token = token.command
        if (!(token instanceof CommandToken && token.cmd == 'skip'))
            continue
        let target = token.lineIndex + parseInt(token.args[0])
        let j = i
        // The next line after the original target is the new target.
        // Both loops are necessary for negative delta to locate the new target
        j = block.findIndex(t=>t.lineIndex > target)
        token.args[0] = (j - i).toString()
    }
}

function dwaveFileConvert(num: string|number, file: string) {
    if (+num !== 0)
        throw Error(`Unexpected argument ${num} for dwaveloop`)
    const wavRe = /"?wave\\se_(?<n>\d+).wav"?/
    let m = file.match(wavRe)
    if (!m)
        throw Error(`Could not parse argument ${file} for dwaveloop`)
    const n = Number.parseInt(m.groups!['n'])
    return `se${n-1}`
}

function genericTokenFixes(clickRE: RegExp|null, token: Token) {
    if (token instanceof TextToken) {
        if (clickRE) 
            token.text = token.text.replaceAll(clickRE, '@')
        
        token.text = token.text
                .replaceAll(/@{2,}/g, '@')// remove dup. '@' if any
                .replaceAll(/[-―─―—]{2,}/g, (match)=> `[line=${match.length}]`)
    } else if (token instanceof CommandToken) {
        switch (token.cmd) {
            case 'bg' : case 'cl' : case 'ld' :
                formatGraphics(token)
                break
            case 'waittimer' : case 'delay' :
                token.cmd = 'wait'
                break
            case 'select' :
                token.args = token.args.map(arg=> {
                    arg = arg.trim()
                    if (['"', '`', "'"].includes(arg.charAt(0)))
                        arg = `\`${arg.substring(1, arg.length-1).trim()}\``
                    arg = arg.replaceAll(/[-―─―—]{2,}/g, (m)=> `[line=${m.length}]`)
                    return arg
                })
                break
            case 'mov' :
                if (token.args[1].includes('image')) {
                    token.args[1] = simplifyImage(token.args[1])
                }
                break
            case 'mp3loop' :
                token.cmd = "play"
                if (/m\d+/.test(token.args[0])) {
                    token.args[0] = `"*${token.args[0].substring(1)}"`
                } else if (token.args[0].includes("bgm")) {
                    // "bgm\07.wav"
                    const match = token.args[0].match(/bgm\\(\d+)\.wav/)
                    if (match && match[1]) {
                        const num = parseInt(match[1], 10)
                        token.args[0] = `"*${num}"`
                    }
                } else if (token.args[0].startsWith('se'))
                    token.cmd = 'waveloop'
                break
            case 'dwavestop' :
                token.cmd = 'wavestop'
                break
            case 'dwave' :
                token.cmd = 'wave'
                token.args = [dwaveFileConvert(...(token.args as [string, string]))]
                break
            case 'dwaveloop' :
                token.cmd = 'waveloop'
                token.args = [dwaveFileConvert(...(token.args as [string, string]))]
                break
            case 'stop' :
                token.cmd = 'playstop' // could be used to stop both music
                                       // and se, but used only for music
                break
        }
    }
}

function genericBlocFixes(block: Block) {
    // Remove '@' right before '\'
    for (const [t, i] of block) {
        if (t instanceof TextToken) {
            // merge adjacent text lines
            if (i == 0)
                continue // no previous line
            const prev = block.at(i-1)
            if (!(prev instanceof TextToken))
                continue // previous line is not text
            if (/^[\s　".…『「\[-―─―—]/.test(t.text))
                continue // appropriate paragraph start
            if (/[@".,:;?!」。！？、，…\]-―─―—』]$/.test(prev.text))
                continue // appropriate paragraph end in previous line
            prev.text += t.text
            block.delete(i)
        } else if (t instanceof CommandToken && t.cmd == '\\') {
            const prevToken = i > 0 ? block.at(i-1) : null
            if (prevToken instanceof TextToken && prevToken.text.endsWith('@'))
                prevToken.text = prevToken.text.substring(0, prevToken.text.length-1)
        }
    }
}


//#endregion ###################################################################
//#region                          CONVERSION
//##############################################################################


function fixTokens(block: Block,
                   tokenFixes:Array<(token: Token)=>void|boolean|string> = [],
                   clickRE:RegExp|null = null) {
    tokenFixes.unshift(genericTokenFixes.bind(undefined, clickRE))
    for (const [t, i] of block) {
        if (t instanceof ErrorToken) {
            block.delete(i)
            continue
        }
        let modified = false
        for (const fix of tokenFixes) {
            const fixResult = fix(t)
            if (fixResult != undefined && fixResult != true) {
                modified = true
                block.delete(i)
                if (fixResult) {
                    block.insert(i, fixResult, t.lineIndex)
                }
                break
            }
        } if (modified)
            continue // token deleted or replaced
        
        // if previous fixes did not replace token and token is 'if'
        if (t instanceof ConditionToken) {
            const subBlock = new Block("subBlock", [t.command])
            // slice(1) to remove genericTokenFixes (reinserted inside function)
            fixTokens(subBlock, tokenFixes.slice(1), clickRE)
            switch (subBlock.length) {
                case 0 : // empty if
                    block.delete(i)
                    break
                case 1 :
                    t.command = subBlock.at(0)!
                    break
                default : // multiple commands
                    t.not = !t.not
                    // 'skip 1' will be replaced to skip the right number
                    // of lines before generating the files
                    t.command = parseScript(`skip 1`, t.lineIndex)[0]
                    block.insert(i+1, subBlock.tokens as Array<Token>)
                    break
            }
        }
    }
}

type FixFunction = (label: string)=>(null|{
    tokenFixes?: Array<(token: Token)=>void|boolean|string>,
    blockFixes?: Array<(block: Block, label: string)=>void>|null
})

export function fixBlock(block: Block,
                         fixes: NonNullable<ReturnType<FixFunction>>,
                         clickRE: RegExp|null = null) {
    const {tokenFixes = [], blockFixes = []} = fixes
    fixTokens(block, tokenFixes, clickRE)
    for (const f of blockFixes ?? []) {
        f(block, block.name)
        fixTokens(block) // only use generic fixes after calling block-wide fixes
    }
    genericBlocFixes(block)
}

function processBlock(blocks: Map<string, Block>,
                      tokens: Token[],
                      blockProps: FixFunction,
                      start: number = 0,
                      stop: number = tokens.length,
                      clickRE: RegExp|null = null) {
    const label = (tokens[start] as LabelToken).label
    const props = blockProps(label)
    if (props != null) {
        const block = new Block(label, tokens.slice(start, stop))
        fixBlock(block, props, clickRE)
        if (block.length > 0)
            blocks.set(label, block)
    }
}

function splitBlocks(tokens: Token[], blockProps: FixFunction): Map<string, Block> {
    const blocks = new Map<string, Block>()
    let blockStart = -1

    // search clickstr command, will append '@' after each char in clickstr arg.
    const clickStr = (tokens.find(
        t=> t instanceof CommandToken && t.cmd == "clickstr"
    ) as CommandToken<"clickstr">)?.args[0]
        .replace(/^["`]/, '').replace(/["`]$/, '') // remove surrounding quotation marks
        .replace(']', '\\]' ).replace('[', '\\]') // prepend \ before [ and ]
        .replace('\\', '\\\\') // double \
        ?? null
    let clickRE = null
    if (clickStr) {
        // detect position after clickStr sequences not followed by @
        clickRE = new RegExp(`(?<=[${clickStr}])(?![${clickStr}@])`, 'g')
    }

    for (const [i, token] of tokens.entries()) {
        // 2. chose destination file from last label
        if (token instanceof LabelToken) {
            if (blockStart >= 0) {
                processBlock(blocks, tokens, blockProps, blockStart, i, clickRE)
            }
            blockStart = i
        }
    }
    if (blockStart >= 0)
        processBlock(blocks, tokens, blockProps, blockStart, tokens.length)
    
    return new Map([...blocks.entries()].sort(([_1, b1], [_2, b2])=>b1.firstLineIndex - b2.firstLineIndex))
}

function generateScenes(
        blocks: Map<string, Block>,
        fileName: (label:string)=>string|null) {
    const files = new Map<string, Block>()
    blocks.entries().forEach(([label, block])=> {
        const name = fileName(label)
        if (name) {
            if (files.has(name))
                files.get(name)!.extend(block)
            else
                files.set(name, block)
        }
    })
    const fileContents = new Map(files.entries().map(([fileName, block]: [string, Block])=> {
        adjustSkips(block)
        return [fileName, block.toString()]
    }))
    return fileContents
}

function writeScenes(output_dir: string, fileContents: Map<string, string>) {
    if (!fs.existsSync(output_dir))
        fs.mkdirSync(output_dir, { recursive: true })

    for (const [file, content] of fileContents.entries()) {
        fs.writeFileSync(path.join(output_dir, `${file}.txt`), content + '\n')
    }
}

export {
    splitBlocks,
    generateScenes,
    writeScenes
}
