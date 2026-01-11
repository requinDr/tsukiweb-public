
import fs from 'fs';
import path from 'path';
import { parseScript } from "../../../tsukiweb-common/tools/convert-scripts/parsers/nscriptr.js";
import { Token, CommandToken, TextToken, ConditionToken, LabelToken, ErrorToken } from "../../../tsukiweb-common/tools/convert-scripts/parsers/utils.js"

//##############################################################################
//#region                       GENERIC FIXES
//##############################################################################

const durations = new Map(Object.entries({'fst': 400, 'mid': 800, 'slw': 1500}))

function simplifyImage(image) {
    return image.replaceAll('\\', '/')
                .replace(/^"(:a;)?image\//, '"')
                .replace(/.(jpg|png)"$/, '"')
}

/** @param {Token[]} token */
function formatGraphics(token) {
    if (!isNaN(token.args[token.args.length-1]))
        return // number as last argument => already formatted
    // Extract arguments
    let pos = 'bg', image = '', effect = ''
    switch (token.cmd) {
        case 'bg': [image, effect] = token.args; break;
        case 'ld': [pos, image, effect] = token.args; break;
        case 'cl': [pos, effect] = token.args; break;
    }

    // Clean and divide effect into type and duration
    if (effect.startsWith('%type_'))
        effect = effect.substring('%type_'.length)
    let i = effect.lastIndexOf('_')
    let time = 0
    if (i >= 0) {
        const speed = effect.substring(i+1)
        effect = effect.substring(0, i)
        if (isNaN(speed))
            time = durations.get(speed)
        else
            time = +speed
        if (!time)
            throw Error(`Ill-formed effect: ${token}`)
    } else if (!(/^(crossfade|(no)?waitdisp|[rltb](shutter|cartain|maskcross|scroll))/.test(effect))){
        throw Error(`Ill-formed effect: ${token}`)
    } else {
        time = 0
    }
    
    if (["waitdisp", "nowaitdisp"].includes(effect))
        effect = "notrans"

    // Simplify image name
    image = simplifyImage(image)
    
    //if (COLOR_IMAGES.has(image))
    //    image = COLOR_IMAGES.get(image)
    switch(token.cmd) {
        case 'bg' : token.args = [image, effect, time]; break
        case 'ld' : token.args = [pos, image, effect, time]; break
        case 'cl' : token.args = [pos, effect, time]; break
    }
}

function adjustSkips(tokens) {
    for (let [i, token] of tokens.entries()) {
        if (token instanceof ConditionToken)
            token = token.command
        if (!(token instanceof CommandToken && token.cmd == 'skip'))
            continue
        let target = token.lineIndex + parseInt(token.args[0])
        let j = i
        // The next line after the original target is the new target.
        // Both loops are necessary for negative delta to locate the new target
        while (j >= 0 && tokens[j].lineIndex > target)
            j--
        while (j < tokens.length && tokens[j].lineIndex < target)
            j++
        token.args[0] = j - i
    }
}

/**
 * @param {string|number} num 
 * @param {string} file
 */
function dwaveFileConvert(num, file) {
    if (+num !== 0)
        throw Error(`Unexpected argument ${num} for dwaveloop`)
    const wavRe = /"?wave\\se_(?<n>\d+).wav"?/
    let m = file.match(wavRe)
    if (!m)
        throw Error(`Could not parse argument ${file} for dwaveloop`)
    const n = m.groups['n']
    return `se${n-1}`
}

/**
 * @param {Token} token
 * @param {Readonly<Token[]>} tokens
 * @param {number} index
 * @param {string[]} clickChars
 */
function genericTokenFixes(clickChars, token) {
    if (token instanceof TextToken) {
        for (const c of clickChars)
            token.text = token.text.replaceAll(c, c + '@')
        
        token.text = token.text
                .replaceAll(/@{2,}/g, '@')// remove dup. '@' if too much added by clickChars
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
                token.args = [dwaveFileConvert(...token.args)]
                break
            case 'dwaveloop' :
                token.cmd = 'waveloop'
                token.args = [dwaveFileConvert(...token.args)]
                break
            case 'stop' :
                token.cmd = 'playstop' // could be used to stop both music
                                       // and se, but used only for music
                break
        }
    }
}

function genericBlocFixes(tokens) {
    // Remove '@' right before '\'
    for (const [t, i] of tokens.entries()) {
        if (t instanceof CommandToken && t.cmd == '\\') {
            const prevToken = i > 0 ? tokens[i-1] : null
            if (prevToken instanceof TextToken && prevToken.endsWith('@'))
                prevToken.text = prevToken.text.substring(0, prevToken.text.length-1)
        }
    }
}


//#endregion ###################################################################
//#region                          CONVERSION
//##############################################################################

/**
 * 
 * @param {Token[]} tokens
 * @param {Array<(token: Token)=>void|boolean|string>} tokenFixes
 */
function fixTokens(tokens, tokenFixes = [], clickChars = undefined) {
    // search clickstr command, will append '@' after each char in clickstr arg.
    clickChars = clickChars ?? tokens.find(
        t=> t instanceof CommandToken && t.cmd == "clickstr"
    )?.args[0].replace(/^["`]/, '').replace(/["`]$/, '').split('') ?? []

    tokenFixes.unshift(genericTokenFixes.bind(undefined, clickChars))
    
    for (let i=0; i < tokens.length; i++) {
        let token = tokens[i]
        if (typeof token == 'string') {
            tokens.splice(i, 1, ...parseScript(token, i > 0 ? tokens[i-1].index : 0))
            i--
        } else if (token instanceof ErrorToken) {
            tokens.splice(i, 1)
            i--
        } else {
            for (const fix of tokenFixes) {
                let fixResult = fix(token)
                if (fixResult != undefined && fixResult != true) {
                    if (fixResult == false)
                        tokens.splice(i, 1)
                    else
                        tokens.splice(i, 1, ...parseScript(s, token.index))
                    i--
                    break // restart fixing this token
                }
            }
            // if previous fixes did not replace token and token is 'if'
            if (tokens[i] == token && token instanceof ConditionToken) {
                const subTokens = [token.command]
                // slice(1) to remove genericTokenFixes
                fixTokens(subTokens, tokenFixes.slice(1), clickChars)
                switch (subTokens.length) {
                    case 0 : // empty if
                        tokens.splice(i, 1)
                        i--
                        break
                    case 1 :
                        tokens.command = subTokens[0]
                        break
                    default : // multiple commands
                        // 'skip 1' will be replaced to skip the right number
                        // of lines before generating the files
                        token.command = parseScript(`skip 1`, token.index)[0]
                        tokens.splice(i+1, 0, ...subTokens)
                        i += subTokens.length // inserted tokens already fixed
                        break
                }
            }
        }
    }
}

/**
 * @param {Map<string, Token[]>} blocks
 * @param {Token[]} tokens 
 * @param {(label: string)=>(null|{
 *  tokenFixes?: Array<(token: Token)=>void|boolean|string>,
 *  blockFixes?: Array<(tokens: Token[], label: string)=>void>|null
 * })} blockProps 
 * @param {number} start
 * @param {number} stop
 */
function processBlock(blocks, tokens, blockProps, start, stop) {
    const label = tokens[start].label
    const props = blockProps(label)
    if (props != null) {
        const {tokenFixes = [], blockFixes = []} = props
        let blockTokens = tokens.slice(start, stop)
        fixTokens(blockTokens, tokenFixes)
        for (const f of blockFixes) {
            f(blockTokens, label)
            blockTokens = blockTokens.filter(t=>t != null)
            fixTokens(blockTokens) // only use generic fixes
        }
        genericBlocFixes(blockTokens)
        blocks.set(label, blockTokens)
    }
}
/**
 * @param {Token[]} tokens 
 * @param {(label: string)=>(null|{
 *  tokenFixes?: Array<(token: Token)=>void|boolean|string>,
 *  blockFixes?: Array<(tokens: Token[], label: string)=>void>|null
 * })} blockProps 
 * @returns {Map<string, Token[]>}
 */
function splitBlocks(tokens, blockProps) {
    const blocks = new Map()
    let blockStart = -1
    for (const [i, token] of tokens.entries()) {
        // 2. chose destination file from last label
        if (token instanceof LabelToken) {
            if (blockStart >= 0) {
                processBlock(blocks, tokens, blockProps, blockStart, i)
            }
            blockStart = i
        }
    }
    if (blockStart >= 0)
        processBlock(blocks, tokens, blockProps, blockStart, tokens.length)
    
    return new Map([...blocks.entries()].sort(([_1, t1], [_2, t2])=>t1[0].index - t2[0].index))
}
/**
 * Generate scene contents from blocks
 * @param {Map<string, {file: string, tokens: Token[]}>} blocks
 * @param {(label:string)=>null|{
 *  name: string,
 *  fixes?: (tokens: Token[], fileName: string)=>void
 * }} fileProps
 * @returns {Map<string, string>} Map of file names to their content
 */
function generateScenes(blocks, fileProps) {
    const files = new Map()
    const fileFixes = new Map()
    blocks.entries().forEach(([label, tokens])=> {
        const props = fileProps(label)
        if (props) {
            const {name, fixes} = props
            files.set(name, [...files.get(name) ?? [], ...tokens])
            if (fixes)
                fileFixes.set(name, fixes)
        }
    })
    const fileContents = new Map(files.entries().map(([fileName, tokens])=> {
        if (fileFixes.has(fileName)) {
            fileFixes.get(fileName)(tokens, fileName)
            fixTokens(tokens)
            tokens = tokens.filter(t=>t != null)
        }
        adjustSkips(tokens)
        const fileContent = tokens.map(t=>t.toString().trimEnd()).join('\n')
        return [fileName, fileContent]
    }))
    return fileContents
}

function writeScenes(output_dir, fileContents) {
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