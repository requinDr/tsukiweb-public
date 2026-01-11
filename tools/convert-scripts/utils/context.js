import { CommandToken, ConditionToken, LabelToken, TextToken, Token } from "../../../tsukiweb-common/tools/convert-scripts/parsers/utils.js";

/**
 * @param {Token[]} tokens
 * @param {(cmd:string, args:Array)=>[object, boolean]} cmdToProps
 * @param {(props:Map<string,any>)=>string[]} propsToCmds
 * @param {object[]} previousContexts
 */
function processContext(tokens, cmdToProps, propsToCmds, previousContexts) {
    let ctx = {}
    let startContext = ctx
    let endContext = {}
    for (let token of tokens) {
        if (token instanceof ConditionToken)
            token = token.command
        let delay = false
        if (token instanceof TextToken)
            delay = true
        else if (token instanceof CommandToken) {
            let props
            [props, delay] = cmdToProps(token.cmd, token.args)
            for (const [prop, value] of Object.entries(props)) {
                if (ctx == endContext || !(Object.hasOwn(ctx, prop)))
                    ctx[prop] = value
            }
        }
        if (delay && ctx == startContext) {
            endContext = ctx = JSON.parse(JSON.stringify(ctx))
        }
    }
    const missing_props = new Map()
    for (const ctx of previousContexts) {
        for (const [key, value] of Object.entries(ctx)) {
            if (!Object.hasOwn(startContext, key)) {
                if (!missing_props.has(key))
                    missing_props.set(key, value)
                else if (missing_props.get(key) != value)
                    throw Error(`Differences in previous end contexts on property ${key})`)
            }
        }
    }
    const insert = propsToCmds(missing_props)
    tokens.unshift(...insert)
    // add new properties in end context
    for (const [prop, value] of missing_props) {
        if (!Object.hasOwn(endContext, prop)) {
            endContext[prop] = value
        }
    }
    return endContext
}

/**
 * @param {Map<string, {parents: string[], children: string[], endContext: object}>} blocksTree
 * @param {Map<string, Token[]>} blocks
 * @param {(cmd:string, args:Array)=>[object, boolean]} cmdToProps
 * @param {(props:Map<string,any>)=>string[]} propsToCmds
 */
function fixContexts(blocksTree, blocks, cmdToProps, propsToCmds) {
    for (const [label, {parents}] of blocksTree) { // nodes are already ordered correctly
        const tokens = blocks.get(label)
        if (!tokens)
            throw Error(`Error: no block named ${label}`)
        const parentContexts = parents.map(p=>blocksTree.get(p).endContext)
        if (parentContexts.some((c=>c == null)))
            throw Error(`Incomplete previous contexts of ${label}`)
        try {
            const endContext = processContext(tokens, cmdToProps, propsToCmds, parentContexts)
            blocksTree.get(label).endContext = endContext
        } catch (e) {
            console.error(`error while fixing contexts of ${label}`)
        }
    }
}

export {
    fixContexts
}