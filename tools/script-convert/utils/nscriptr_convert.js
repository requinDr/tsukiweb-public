
import fs from 'fs';
import path from 'path';
import { parseScript } from "../parsers/nscriptr.js";
import { Token, CommandToken, TextToken, ConditionToken, LabelToken, ErrorToken } from "../parsers/utils.js"

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
 * @param {Token[]} tokens
 * @param {number} index
 * @param {string[]} clickChars
 */
function genericFixes(token, tokens, index, clickChars) {
    if (token instanceof TextToken) {
        for (const c of clickChars) {
            token.text = token.text.replaceAll(c, c + '@')
        }
        
        token.text = token.text
                .replaceAll(/@{2,}/g, '@')// remove dup. '@' if too much added by clickChars
                .replaceAll(/[-―─―—]{2,}/g, (match)=> `[line=${match.length}]`)
        if (token.text.endsWith('@') && index < tokens.length - 1) {
            // remove '@' if right before '\'
            const nextToken = tokens[index+1]
            if (nextToken instanceof CommandToken && nextToken.cmd == '\\')
                token.text = token.text.substring(0, token.text.length-1)
        }
        
    } else if (token instanceof ConditionToken) {
        genericFixes(token.command, tokens, index, clickChars)
    } else if (token instanceof CommandToken) {
        switch (token.cmd) {
            case 'bg' : case 'cl' : case 'ld' :
                formatGraphics(token)
                break
            case 'waittimer' : case 'delay' :
                token.cmd = 'wait'
                break
            case 'select' :
                token.args.forEach((arg, i, args)=> {
                    if (/^".*"$/.test(arg)) { // replace " with `
                        arg = arg.substring(1, arg.length-1)
                        args[i] = `\`${arg}\``
                    }
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


//#endregion ###################################################################
//#region                          CONVERSION
//##############################################################################

/**
 * @param {string|null} output_dir
 * @param {Token[]} tokens
 * @param {string} logicFileName
 * @param {(label:string)=>string|null} getFile
 * @param {(files:Map<string, Token[]>)=>void} fixes
 */
function generate(output_dir, tokens, getFile, fixes) {
    // 1. search for specific setup commands
    // 1.1. clickstr
    let clickChars = tokens.find(
        t=> t instanceof CommandToken && t.cmd == "clickstr"
    )?.args[0].replace(/^["`]/, '').replace(/["`]$/, '').split('') ?? ''
    
    //----------
    /** @type {Map<string, Token[]>} */
    const files = new Map()
    let file = null
    let fileTokens = []
    for (const [i, token] of tokens.entries()) {
        // 2. chose destination file from last label
        if (token instanceof LabelToken) {
            file = getFile(token.label)
            if (file) {
                if (!files.has(file))
                    files.set(file, [])
                fileTokens = files.get(file)
            }
        }
        if (file) {
            if (token && !(token instanceof ErrorToken)) {
                genericFixes(token, tokens, i, clickChars)
                fileTokens.push(token)
            }
        }
    }
    tokens = tokens.filter(t=>t != null)
    fixes(files)
    for (let [file, tokens] of files.entries()) {
        // 5. custom fixes, then remove null tokens if necessary
        tokens = tokens.filter(t => t != null)
        for (const [i, token] of tokens.entries()) {
            // convert strings to tokens
            if (token instanceof Token)
                continue
            else if (token.substring) {
                let newTokens = parseScript(token)
                genericFixes(newTokens)
                lineIndex = (i > 0) ? tokens[i-1].lineIndex : 0
                newTokens.forEach(t=> t.lineIndex = lineIndex)
                tokens.splice(i, 1, ...newTokens)
            } else {
                throw Error(`Could not convert ${t} to script token`)
            }
        }
        // 6. generic fixes after custom fixes
        adjustSkips(tokens)
        // 7. print to file
        const file_str = tokens.map(t=>t.toString().trimEnd()).join('\n')
        if (output_dir) {
            if (!fs.existsSync(output_dir))
                fs.mkdirSync(output_dir);
            fs.writeFileSync(path.join(output_dir, `${file}.txt`), file_str+'\n')
        }
    }
}

export {
    generate
}