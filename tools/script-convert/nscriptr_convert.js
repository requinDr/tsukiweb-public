
import fs from 'fs';
import path from 'path';
import { Token, CommandToken, TextToken, ConditionToken, LabelToken, ErrorToken, ReturnToken, parseScript } from "./parsers/nscriptr.js";

//##############################################################################
//#region                       GENERIC FIXES
//##############################################################################

const durations = new Map(Object.entries({'fst': 400, 'mid': 800, 'slw': 1500}))

function simplifyImage(image) {
    return image.replaceAll('\\', '/')
                .replace(/^"(:a;)?image\//, '"')
                .replace(/.jpg"$/, '"')
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

const IGNORED_VARIBLES = [
	'%rockending',
]

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

function genericFixes(token, clickChars) {
    if (token instanceof TextToken) {
        for (const c of clickChars) {
            token.text = token.text.replaceAll(c, c + '@')
        }
        // remove duplicate '@' if too much was added by clickChars
        token.text = token.text.replaceAll(/@{2,}/g, '@')
        let m
        while ((m = /[-―─―]{2,}/g.exec(token.text)) !== null) {
            const len = m[0].length
            const textBefore = token.text.substring(0, m.index)
            const textAfter = token.text.substring(m.index + len)
            token.text = `${textBefore}[line=${len}]${textAfter}`
        }
    } else if (token instanceof ConditionToken) {
        if (!token.condition.startsWith('('))
            token.condition = `(${token.condition})`
        genericFixes(token.command, clickChars)
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
        }
    }
}


//#endregion ###################################################################
//#region                          CONVERSION
//##############################################################################

/**
 * @param {string} output_dir
 * @param {Token[]} tokens
 * @param {string} logicFileName
 * @param {(label:string)=>string|null} getFile
 * @param {(files:Map<string, Token[]>)=>void} fixes
 */
function nscriptr_convert(output_dir, tokens, getFile, fixes) {
    // 1. search for specific setup commands
    // 1.1. clickstr
    let clickChars = tokens.find(
        t=> t instanceof CommandToken && t.cmd == "clickstr"
    )?.args[0].replace(/^"/, '').replace(/"$/, '').split('')
    
    //----------
    /** @type {Map<string, Token[]>} */
    const files = new Map()
    let file = null
    let fileTokens = []
    for (const token of tokens) {
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
            if (!(token instanceof ErrorToken)) {
                genericFixes(token, clickChars)
                fileTokens.push(token)
            }
        }
    }
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
                tokens.splice(i, 0, ...newTokens)
            } else {
                throw Error(`Could not convert ${t} to script token`)
            }
        }
        // 6. generic fixes after custom fixes
        adjustSkips(tokens)
        // 7. print to file
        const file_str = tokens.map(t=>t.toString()).join('\n')
        if (output_dir) {
            if (!fs.existsSync(output_dir))
                fs.mkdirSync(output_dir);
            fs.writeFileSync(path.join(output_dir, `${file}.txt`), file_str+'\n')
        }
    }
}

export {
    nscriptr_convert
}