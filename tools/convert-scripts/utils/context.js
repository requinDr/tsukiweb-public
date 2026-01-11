import { CommandToken, ConditionToken, LabelToken, TextToken, Token } from "../../../tsukiweb-common/tools/convert-scripts/parsers/utils.js";

/**
 * @param {Token[]} tokens
 * @param {(cmd:string, args:Array)=>[object, boolean]} cmdToProps
 * @param {(props:Map<string,any>)=>string[]} propsToCmds
 * @param {object[]} previousContexts
 */
function processContext(tokens, cmdToProps, propsToCmds, previousContexts) {
    let ctx = new Map()
    let startContext = ctx
    let endContext = null
    for (let token of tokens) {
        let delay = false
        if (token instanceof ConditionToken)
            token = token.command
        if (token instanceof TextToken)
            delay = true
        else if (token instanceof CommandToken) {
            let props
            [props, delay] = cmdToProps(token.cmd, token.args)
            for (const [prop, value] of Object.entries(props)) {
                if (ctx == endContext || !ctx.has(prop))
                    ctx.set(prop, value)
            }
        }
        if (delay && ctx == startContext) {
            endContext = ctx = new Map(ctx)
        }
    }
    const missing_props = new Map()
    const overridden_props = []
    for (const ctx of previousContexts) {
        for (const [prop, value] of Object.entries(ctx)) {
            if (!startContext.has(prop)) {
                if (!missing_props.has(prop))
                    missing_props.set(prop, value)
                else if (missing_props.get(prop) != value)
                    throw Error(`Differences in previous end contexts on property ${prop})`)
            } else {
                overridden_props.push(prop)
            }
        }
    }
    const insert = propsToCmds(missing_props)
    tokens.unshift(...insert)
    // add properties in end context from previous scenes that were not changed in the scene
    for (const [prop, value] of missing_props) {
        if (!endContext.has(prop)) {
            endContext.set(prop, value)
        }
    }
    // remove null end context properties that were not specified in end contexts of previous scenes
    for (const [prop, value] of endContext) {
        if (value == null && !missing_props.has(prop) && !overridden_props.includes(prop))
            endContext.delete(prop)
    }
    return Object.fromEntries(endContext.entries())
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