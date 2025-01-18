import {StrReader} from "./utils.js"

const CONDITION_REGEXP = /((^|\s*[&<>!=]*)\s*([%$\d-]\w*|fchk|"[^"]"))*/
// [%$]X*|N* <=!> [%$]X*|N* (&& ...)*
const ARGUMENT_REGEXP = /^`[^`]*`|"[^"]*"|[\w%$*-]+/

class Token {
    /**
     * @param {number} lineIndex 
     * @param {string} text 
     */
    constructor(lineIndex) {
        this.lineIndex = lineIndex
    }

    toString() {
        throw Error(`Unimplemented method 'toString'`)
    }

    static tokenize(lineIndex, txt) {
        throw Error(`Unimplemented method 'tokenize'`)
    }
}

class TextToken extends Token {
    constructor(lineIndex, text) {
        super(lineIndex)
        this.text = text
    }

    toString() {
        return `\`${this.text}`
    }

    static tokenize(lineIndex, txt) {
        if (txt.startsWith('`'))
            txt = txt.substring(1)
        let texts = txt.split('\\')
        if (texts.length == 1) {
            return [new TextToken(lineIndex, txt)]
        }
        // if '\' must be kept at end of text line instead of on separate line,
        // simply split *after* each '\'
        let tokens = []
        if (texts[0].length > 0)
            tokens.push(new TextToken(lineIndex, texts[0]))
        for (let i=1; i < texts.length; i++) {
            tokens.push(new CommandToken(lineIndex, '\\'))
            if (texts[i].length > 0)
                tokens.push(new TextToken(lineIndex, texts[i]))
        }
        return tokens
    }
}

class CommandToken extends Token {
    constructor(lineIndex, cmd, args = []) {
        super(lineIndex)
        this.cmd = cmd
        this.args = args
    }

    toString() {
        if (this.args.length == 0)
            return this.cmd
        if (this.cmd.startsWith('!')) {
            if (this.args.length > 1)
                throw Error(`Unexpected multiple arguments for ${this.cmd} at line ${this.lineIndex}`)
            return `${this.cmd}${this.args[0]}`
        }
        return `${this.cmd} ${this.args.join(',')}`
    }

    /**
     * @param {number} lineIndex 
     * @param {string} txt
     */
    static tokenize(lineIndex, txt) {
        let cmd, arg, args, reader
        switch (txt.charAt(0)) {
            case '@' : case '\\' : case '~' :
                if (txt.length > 1)
                    throw Error(`Unexpected command ${txt}`)
                return [new CommandToken(lineIndex, txt)]
            case '+' : return [] // unknown command. Ignore.
            case '!' :
                reader = new StrReader(txt)
                cmd = reader.readMatch(/^![a-z]+/)
                arg = reader.read()
                args = arg ? [arg] : []
                return [new CommandToken(lineIndex, cmd, args)]
            case '#' :
                return new CommandToken(lineIndex, 'textcolor', txt)
            default :
                reader = new StrReader(txt)
                cmd = reader.readMatch(/^\w+\b/)
                reader.readMatch(/\s*/)
                args = []
                while (!reader.atEnd()) {
                    arg = reader.readMatch(ARGUMENT_REGEXP)
                    reader.readMatch(/\s*,\s*/)
                    if (!arg)
                        break
                    args.push(arg)
                }
                return [new CommandToken(lineIndex, cmd, args)]
        }
    }
}

class LabelToken extends Token {
    constructor(lineIndex, label) {
        super(lineIndex)
        this.label = label
    }

    toString() {
        return `*${this.label}`
    }

    static tokenize(lineIndex, txt) {
        if (txt.startsWith('*'))
            txt = txt.substring(1)
        return [new LabelToken(lineIndex, txt)]
    }
}

class ReturnToken extends Token {

    toString() {
        return 'return'
    }

    static tokenize(lineIndex, txt) {
        return [new ReturnToken(lineIndex)]
    }
}

class ConditionToken extends Token {
    constructor(lineIndex, not, condition, command) {
        super(lineIndex)
        this.not = not
        this.condition = condition // TODO normalize operators and spaces around them
        this.command = command
    }
    toString() {
        return `${this.not? 'not':''}if ${this.condition} ${this.command.toString()}`
    }

    static tokenize(lineIndex, txt) {
        const cmdReader = new StrReader(txt)
        let cmd = cmdReader.readMatch(/^\w+\b/)
        let not
        switch(cmd) {
            case 'if' : not = false; break;
            case 'notif' : not = true; break;
            default : throw Error(`Unexpected command '${cmd}' for condition token`)
        }
        cmdReader.readMatch(/\s*/) //trim whitespaces
        const condition = cmdReader.readMatch(CONDITION_REGEXP)
        // extract commands until end of line (separated by ':')
        const commands = parseScript(cmdReader.read().trim())
        commands.forEach(tkn=> tkn.lineIndex += lineIndex)
    
        if (commands.length == 1)
            return [new ConditionToken(lineIndex, not, condition, commands[0])]
        
        not = !not
        const skip = parseScript("skip 1") //TODO check if 1 or 2
        if (skip.length != 1)
            throw Error("Error parsing inserted 'skip 1'")
        skip[0].lineIndex += lineIndex
        return [
            new ConditionToken(lineIndex, not, condition, skip[0]),
            ...commands
        ]
    }
}

class ErrorToken extends Token {
    constructor(lineIndex, txt) {
        super(lineIndex)
        this.txt = txt
    }

    static tokenize(lineIndex, txt) {
        console.log(`Error line ${lineIndex}: ${txt}`)
        return [new ErrorToken(lineIndex, txt)]
    }
}

const tokensRE = new Map(Object.entries({
    'comment'       : [/^(\s*(;.*)?\r?\n)+/, null],
    'asciiText'     : [/^`[^\n`]*(`|\r?\n)/, TextToken],
    'nonAsciiText'  : [/^\s*[^A-za-z0-9;`*@\\+!:,~"][^\n\\]*/u, TextToken],
    'return'        : [/^\s*return\s*\r?\n/, ReturnToken],
    'condition'     : [/^\s*(not)?if\s[^\n]*/, ConditionToken],
    'cmd'           : [/^\s*(?<cmd>[a-zA-Z]\w+)[ \t]*(?<args>(([\w%$_#*-]*|"([^\n"]|(_"))*"|`[^`]*`)(,\s*)?[ \t]*)+)?/u, CommandToken],
    'cmd2'          : [/^[@\\+]/, CommandToken],
    'cmd3'          : [/^![a-z]+\d*/, CommandToken],
    'cmd4'          : [/^#[\da-fA-F]+/, CommandToken],
    'label'         : [/^\*\w*\b/, LabelToken],
    'separator'     : [':', null],
    'error1'        : [/^"\r?\n/, ErrorToken]
}))

/**
 * @param {string} text 
 */
function parseScript(text) {
    const reader = new StrReader(text)
    const tokens = []
    
    while (!reader.atEnd()) {
        let found = false
        let lineIndex = reader.lineIndex
        
        for (const [name, [re, cls]] of tokensRE.entries()) {
            const tokenText = reader.readMatch(re, true);
            if (tokenText) {
                found = true
                if (cls)
                    tokens.push(...cls.tokenize(lineIndex, tokenText.trimEnd()))
                break;
            }
        }
        if (!found) {
            debugger;
            throw Error(`Cannot determine token for text: '${reader.peek(30)}'`)
        }
    }
    return tokens
}

export {
    parseScript,
    Token,
    CommandToken,
    TextToken,
    ConditionToken,
    ErrorToken,
    LabelToken,
    ReturnToken
}