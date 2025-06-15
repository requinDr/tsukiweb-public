import { CommandToken, ConditionToken, LabelToken, TextToken, Token } from "./parsers/utils.js";

class Scene {
    /**
     * @param {string} label
     */
    constructor(label) {
        this._index = -1
        this._parentScenes = []
        this._childrenScenes = []
        this._tokens = []
        this._label = label
        this._startContext = new Map()
        this._endContext = new Map()
        this._ctxCalculated = false
    }
    get index() {
        if (this._index == -1) {
            this._index = this._parentScenes.reduce(
                (max, scene) => Math.max(max, scene.index),
                0)
        }
        return this._index
    }
    isScene() {
        return this._tokens?.length ?? 0 > 0
    }
    setTokens(tokens) {
        this._tokens = tokens
    }
    addChildScene(scene) {
        if (!this._childrenScenes.includes(scene)) {
            this._childrenScenes.push(scene)
            scene._parentScenes.push(this)
        }
    }
    delete() {
        for (const child of this._childrenScenes) {
            for (const parent of this._parentScenes) {
                parent.addChildScene(child)
            }
            child._parentScenes.splice(child._parentScenes.indexOf(this), 1)
        }
        for (const parent of this._parentScenes) {
            parent._childrenScenes.splice(parent._childrenScenes.indexOf(this), 1)
        }
    }
    /**
     * @param {(cmd:string, args:Array)=>[object, boolean]} cmdToProps
     */
    _calculateContexts(cmdToProps) {
        let ctx = this._startContext
        for (let token of this._tokens) {
            if (token instanceof ConditionToken)
                token = token.command
            let delay = false
            if (token instanceof TextToken)
                delay = true
            else if (token instanceof CommandToken) {
                let props
                [props, delay] = cmdToProps(token.cmd, token.args)
                for (const [prop, value] of Object.entries(props)) {
                    if (ctx == this._endContext || !(ctx.has(prop)))
                        ctx.set(prop, value)
                }
            }
            if (delay && ctx == this._startContext) {
                ctx = this._endContext
                for (const [prop, value] of this._startContext.entries()) {
                    ctx.set(prop, value)
                }
            }
        }
        this._ctxCalculated = true
    }
    /**
     * @param {(cmd:string, args:Array)=>[object, boolean]} cmdToProps
     */
    getStartContext(cmdToProps) {
        if (!this._ctxCalculated)
            this._calculateContexts(cmdToProps)
        return this._startContext
    }
    /**
     * @param {(cmd:string, args:Array)=>[object, boolean]} cmdToProps
     */
    getEndContext(cmdToProps) {
        if (!this._ctxCalculated)
            this._calculateContexts(cmdToProps)
        return this._endContext
    }
    /**
     * @param {(cmd:string, args:Array)=>[object, boolean]} cmdToProps
     * @param {(props:Map<string,any>)=>string[]} propsToCmds
     */
    fixStartContext(cmdToProps, propsToCmds) {
        if (this._parentScenes.length == 0)
            return
        const start_ctx = this.getStartContext(cmdToProps)
        const prev_contexts = this._parentScenes.map(s=> s.getEndContext(cmdToProps))
        const missing_props = new Map()
        for (const ctx of prev_contexts) {
            for (const [key, value] of ctx.entries()) {
                if (start_ctx.has(key))
                    ctx.delete(key)
                else if (!missing_props.has(key))
                    missing_props.set(key, value)
                else if (missing_props.get(key) != value)
                    throw Error(`Differences in end contexts before ${this._label} (scenes ${this._parentScenes.map(s=>s._label)} on property ${key})`)
            }
        }
        const insert = propsToCmds(missing_props)
        this._tokens.unshift(...insert)
        // add new properties in end context
        for (const [prop, value] of missing_props) {
            if (!this._endContext.has(prop)) {
                this._endContext.set(prop, value)
            }
        }
    }
}

/**
 * @param {Map<string, Token[]>} files 
 * @param {string} logicFileName 
 * @param {(string)=>string|null} getSceneName 
 * @param {Map<string, {label: string, scene?: string, children?: string[], parents?: string[]}} additionalLabels
 * @returns {Map<string, Scene>}
 */
function getScenes(files, logicFileName, getSceneName, additionalLabels) {
    const logicTokens = files.get(logicFileName)
    const scenes = new Map()
    let scene = null
    const getScene = (label) => {
        if (label.startsWith('*')) label = label.substring(1)
        if (!scenes.has(label)) scenes.set(label, new Scene(label))
        return scenes.get(label)
    }
    for (const [label, {scene = null, children = [], parents = []}] of additionalLabels.entries()) {
        const s = getScene(label)
        if (scene)
            s.setTokens(files.get(getSceneName(scene)))
        for (const child of children)
            s.addChildScene(getScene(child))
        for (const parent of parents)
            parent.addChildScene(this)
    }
    for (let token of logicTokens) {
        let labels = []
        if (token instanceof ConditionToken)
            token = token.command
        if (token instanceof LabelToken) {
            if (!token.label.startsWith('skip')) {
                scene = getScene(token.label)
            }
        }
        else if (token instanceof CommandToken) {
            if (scene != null)
            switch(token.cmd) {
                case 'select' :
                    for (let i=1; i < token.args.length; i+= 2)
                        labels.push(token.args[i])
                    break
                case 'goto' : case 'gosub' :
                    labels.push(token.args[0])
            }
        }

        for (let label of labels) {
            if (label.startsWith('*'))
                label = label.substring(1)
            else
                throw Error(`Differences in end contexts before ${this._label}`)
            const sceneName = getSceneName(label)
            if (sceneName) {
                scene.setTokens(files.get(sceneName))
            } else {
                scene.addChildScene(getScene(label))
            }
        }
        
    }
    for (const [label, scene] of scenes.entries()) {
        if (!scene.isScene()) {
            scene.delete()
            scenes.delete(label)
        }
    }
    return scenes
}

/**
 * 
 * @param {Scene[]} scenes 
 * @param {(cmd:string, args:Array)=>[object, boolean]} cmdToProps
 * @param {(props:Map<string,any>)=>string[]} propsToCmds
 */
function fixContexts(scenes, cmdToProps, propsToCmds) {
    scenes = [...scenes.values()].sort((s1, s2)=> s1.index - s2.index)
    for (const scene of scenes) {
        scene.fixStartContext(cmdToProps, propsToCmds)
    }
}

export {
    Scene,
    getScenes,
    fixContexts
}