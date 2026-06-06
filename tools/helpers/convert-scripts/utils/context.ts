import { Block, CommandToken, ConditionToken, LabelToken, TextToken, Token } from "../../../../tsukiweb-common/tools/convert-scripts/parsers/utils.ts";

function processContext(block: Block,
        cmdToProps: (cmd:string, args:string[])=>[object, boolean],
        propsToCmds: (props:Map<string,any>)=>string[],
        previousContexts: object[]) {
    let ctx = new Map()
    let startContext = ctx
    let endContext = null
    for (let [token, i] of block) {
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
    block.insert(0, insert.join('\n'))
    // add properties in end context from previous scenes that were not changed in the scene
    for (const [prop, value] of missing_props) {
        if (!endContext!.has(prop)) {
            endContext!.set(prop, value)
        }
    }
    // remove null end context properties that were not specified in end contexts of previous scenes
    for (const [prop, value] of endContext!) {
        if (value == null && !missing_props.has(prop) && !overridden_props.includes(prop))
            endContext!.delete(prop)
    }
    return Object.fromEntries(endContext!.entries())
}


function fixContexts(
        blocksTree: Map<string, {parents: string[], children: string[], endContext: object|null}>,
        blocks: Map<string, Block>,
        cmdToProps: (cmd:string, args:Array<string>)=>[object, boolean],
        propsToCmds: (props:Map<string,any>)=>string[]) {
    for (const [label, {parents}] of blocksTree) { // nodes are already ordered correctly
        const block = blocks.get(label)
        if (!block)
            throw Error(`Error: no block named ${label}`)
        const parentContexts = parents.map(p=>blocksTree.get(p)!.endContext!)
        if (parentContexts.some((c=>c == null)))
            throw Error(`Incomplete previous contexts of ${label}`)
        try {
            const endContext = processContext(block, cmdToProps, propsToCmds, parentContexts)
            blocksTree.get(label)!.endContext = endContext
        } catch (e) {
            console.error(`error while fixing contexts of ${label}`)
        }
    }
}

export {
    fixContexts
}
