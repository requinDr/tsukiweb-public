
import { getFlowchart, TreeNode } from "./flowchart.js"
import { LOGIC_FILE } from "./script-convert.js"

const TEXT_LINE_REGEXP = /^[`\-―─\[「『\s]/
const isTextLine = TEXT_LINE_REGEXP.test.bind(TEXT_LINE_REGEXP)

const colorImages = new Map(Object.entries({
    '"image\\bg\\ima_10.jpg"' : '#000000',
    '"image\\bg\\ima_11.jpg"' : '#ffffff',
    '"image\\bg\\ima_11b.jpg"': '#9c0120'
}))

function getCmdArg(line) {
    if (isTextLine(line))
        return [null, null]
    let index = line.indexOf(' ');
    let cmd, arg;
    if (index >= 0) {
        cmd = line.substring(0, index);
        arg = line.substring(index+1);
    } else if (line.startsWith('!')) {
        cmd = line.substring(0, 2);
        arg = line.substring(2)
    } else {
        cmd = line;
        arg = null;
    }
    return [cmd, arg]
}

function createNullContext() {
    return {
        graphics: {bg: null, l: null, c: null, r: null},
        track: null,
        waveloop: null,
        monocro: null
    };
}
function isContextNull(ctx) {
    const {graphics: {bg, l, c, r}, track, waveloop, monocro} = ctx
    return bg == null && l == null && c == null && r == null
        && track == null && waveloop == null && monocro == null;
}
function createNeutralContext() {
    return { graphics: {bg: '', l: '', c: '', r: ''}, track: '', waveloop: '', monocro: '' };
}
function contextEqual(ctx1, ctx2) {
    const {graphics: {bg1, l1, c1, r1}, track1, waveloop1, monocro1} = ctx1;
    const {graphics: {bg2, l2, c2, r2}, track2, waveloop2, monocro2} = ctx2;
    if (bg1 != bg2) return false;
    if (l1 != l2) return false;
    if (c1 != c2) return false;
    if (r1 != r2) return false;
    if (track1 != track2) return false;
    if (waveloop1 != waveloop2) return false;
    if (monocro1 != monocro2) return false;
    return true
}
function contextDiff(ctx1, ctx2) {
    const {graphics: {bg: bg1, l: l1, c: c1, r: r1}, track: track1, waveloop: waveloop1, monocro: monocro1} = ctx1
    const {graphics: {bg: bg2, l: l2, c: c2, r: r2}, track: track2, waveloop: waveloop2, monocro: monocro2} = ctx2
    
    const bg = (bg1 != bg2) ? bg2 : null
    const l = (l1 != l2) ? l2 : null
    const c = (c1 != c2) ? c2 : null
    const r = (r1 != r2) ? r2 : null
    const track = (track1 != track2) ? track2 : null
    const waveloop = (waveloop1 != waveloop2) ? waveloop2 : null
    const monocro = (monocro1 != monocro2) ? monocro2 : null
    
    const result = {}
    if (bg != null || l != null || c != null || r != null) {
        result.graphics = { }
        if (bg != null) result.graphics.bg = bg;
        if (l != null) result.graphics.l = l;
        if (c != null) result.graphics.c = c;
        if (r != null) result.graphics.r = r;
    }
    if (track != null) result.track = track
    if (waveloop != null) result.waveloop = waveloop
    if (monocro != null) result.monocro = monocro
    return result
}
function copyContext(ctx) {
    const {graphics: {bg, l, c, r}, track, waveloop, monocro} = ctx
    return {
        graphics: { bg, l, c, r },
        track, waveloop, monocro
    }
}
function contextUnion(ctx1, ctx2) {
    const {graphics: {bg: bg1, l: l1, c: c1, r: r1}, track: track1, waveloop: waveloop1, monocro: monocro1} = ctx1
    const {graphics: {bg: bg2, l: l2, c: c2, r: r2}, track: track2, waveloop: waveloop2, monocro: monocro2} = ctx2
    return {
        graphics: {
            bg: bg1 != null ? bg1 : bg2,
            l: l1 != null ? l1 : l2,
            c: c1 != null ? c1 : c2,
            r: r1 != null ? r1 : r2,
        },
        track: track1 != null ? track1 : track2,
        waveloop: waveloop1 != null ? waveloop1 : waveloop2,
        monocro: monocro1 != null ? monocro1 : monocro2
    }
}

function isContextFull(ctx) {
    const {graphics: {bg, l, c, r}, track, waveloop, monocro} = ctx
    return bg != null && l != null && c != null && r != null
        && track != null && waveloop != null && monocro != null;
}

//#endregion ###################################################################
//#region                          General fixes
//##############################################################################

/**
 * @param {Array<string>} lines
 */
function filterEmptyLines(lines) {
    const result = lines.filter(line => line.length > 0 && !line.startsWith(';'))
    lines.splice(0, lines.length, ...result)
}

/**
 * @param {Array<string>} lines
 */
function replaceColorImages(lines) {
    for (let [i, line] of lines.entries()) {
        for (let [file, color] of colorImages.entries()) {
            if (line.includes(file)) {
                lines[i] = line.replace(file, color)
                break
            }
        }
    }
}

/**
 * @param {Array<string>} lines 
 */
function pipesToEllipsis(lines) {
    let index, endIndex
    for (let [i, line] of lines.entries()) {
        if (!isTextLine(line))
            line = line.replaceAll('|', '…')
        else {
            index = line.indexOf('`')
            while (index >= 0) {
                endIndex = line.indexOf('`', index+1)
                if (endIndex == -1)
                    endIndex = line.length
                if (line.includes('|')) {
                    line = line.substring(0,index+1)
                        + line.substring(index+1,endIndex).replaceAll('|', '…')
                        + line.substring(endIndex)
                }
                index = line.indexOf('`', endIndex+1)
            }
        }
        lines[i] = line
    }
}


// split texts with '\' in the middle, split instructions with ':'
const colonRegexp = /^\s?\w([^"`:]*"[^"`]*")*[^"`:]*:/
/**
 * @param {Array<string>} lines 
 */
function splitInstructions(lines) {
    const result = [];
    let match
    for (let line of lines) {
        if (line.length == 0)
            result.push(line)

        while (line.length > 0) {
            if (isTextLine(line)) {
                let index = line.search(/\\(?!$)/); // '\' before end of line
                if (index == -1) {
                    result.push(line);
                    break;
                } else {
                    result.push(line.substring(0, index+1));
                    line = line.substring(index+1);
                    if (!line.startsWith(' '))
                        line = ' '+line
                    line = '`'+line;
                }
            } else if (match = line.match(colonRegexp)) {
                const index = match[0].length-1;
                result.push(line.substring(0, index).trimEnd());
                line = line.substring(index+1).trimStart();
            } else {
                result.push(line)
                break
            }
        }
    }
    lines.splice(0, lines.length, ...result)
}

//#endregion ###################################################################
//#region                         Specific fixes
//##############################################################################

/**
 * Center all lines that do not start with '---', except the last one
 * @param {Array<string>} lines 
 */
function centerOpenning(lines) {
    let textLines = Array.from(Array.from(lines.entries()).filter(([_i, line])=> {
        if(!isTextLine(line))
            return false; // include only text lines
        if (line.startsWith('`'))
            line = line.substring(1);
        line = line.trimStart();
        if (['-', '─'].includes(line.charAt(0)))
            return false; //lines that start with '---' stay left-aligned
        return true;
    }));

    // add [center] on remaining text lines
    for (let [i, line] of textLines) {
        let prefix = line.startsWith('`') ? '`' : '';
        if (prefix == '`')
            line = line.substring(1);
        line = line.trimStart();
        lines[i] = `${prefix}[center]${line}`;
    }
}

function addContext({graphics = null, track = null, waveloop = null, monocro = null}, _label, lines) {
    // lines.unshift(';---added context above---')
    if (graphics) {
        if (graphics.bg)
            lines.unshift(`bg ${graphics.bg},%type_nowaitdisp`)
        if (graphics.l)
            lines.unshift(`ld l,${graphics.l},%type_nowaitdisp`)
        if (graphics.c)
            lines.unshift(`ld c,${graphics.l},%type_nowaitdisp`)
        if (graphics.r)
            lines.unshift(`ld r,${graphics.l},%type_nowaitdisp`)
    }
    if (track != null)
        lines.unshift(track == '' ? "playstop" : `play ${track}`)
    if (waveloop != null)
        lines.unshift(waveloop == '' ? 'wavestop' : `waveloop ${waveloop}`)
    if (monocro != null)
        lines.unshift(`monocro ${monocro || 'off'}`)
}
/**
 * @type {Object.<string, function(string, Array<string>)>}
 */
const specificFixes = {
    'openning': (_label, lines) => {
        centerOpenning(lines)
    },
}

//#endregion ###################################################################
//#region                         Context check
//##############################################################################

function extractContexts(lines) {
    const ctx = createNullContext();
    let startContext

    let firstDelay = false
    for (const line of lines) {
        const [cmd, arg] = getCmdArg(line);
        let delayHere = false
        switch(cmd) {
            case 'bg' : {
                const [ bg, effect ] = arg.split(',');
                ctx.graphics = { bg: bg, l: '', c :'', r: '' }
                if (!effect.includes('nowaitdisp'))
                    delayHere = true
                break;
            }
            case 'ld' : {
                const [pos, img, effect] = arg.split(',');
                ctx.graphics[pos] = img;
                if (!effect.includes('nowaitdisp'))
                    delayHere = true
                break;
            }
            case 'cl' : {
                let [pos, effect] = arg.split(',');
                if (pos == 'a')
                    ctx.graphics = {bg: ctx.graphics.bg, l: '', c: '', r: ''}
                else
                    ctx.graphics[pos] = '';
                if (!effect.includes('nowaitdisp'))
                    delayHere = true
                break;
            }
            case 'play' : ctx.track = arg; break;
            case 'playstop' : ctx.track = ''; break;
            case 'waveloop' : ctx.waveloop = arg; break;
            case 'wave' :
            case 'wavestop' : ctx.waveloop = ''; break;
            case 'monocro' : ctx.monocro = arg == 'off' ? '' : arg; break;
            case 'gosub' :
                ctx.graphics = {bg: '', l: '', c: '', r: ''};
                ctx.track = '';
                ctx.waveloop = '';
                ctx.monocro = '';
                delayHere = true;
                break;
            case 'delay' :
            case 'waittimer':
            case '!w' :
            case null : delayHere = true; // case null is text line
        }
        if (delayHere && !firstDelay) {
            firstDelay = true;
            startContext = copyContext(ctx);
        }
    }
    return {
        start: startContext ?? ctx,
        end: ctx
    };
}

function getEndContext(label, tree, end_contexts, start_contexts, report) {
    let end_context = end_contexts.get(label);
    if (isContextFull(end_context)) {
        return end_context;
    }
    end_context = contextUnion(end_context, getStartContext(label, tree, end_contexts, start_contexts, report))
    end_contexts.set(label, end_context)
    return end_context
}

function getStartContext(label, tree, end_contexts, start_contexts, report) {
    let start_context = start_contexts.get(label)
    if (isContextFull(start_context)) {
        return start_context;
    }
    const parent_scenes = tree.get(label)?.parent_nodes.map(node => node.scene) ?? []
    if (parent_scenes.length == 0) {
        start_context = contextUnion(start_context, createNeutralContext());
    } else {
        const parent_contexts = parent_scenes.map(scene =>
            contextUnion(start_context,
                         getEndContext(scene, tree, end_contexts, start_contexts, report)
            )
        )
        let context = parent_contexts[0]
        for (let ctx of parent_contexts.slice(1)) {
            if (!contextEqual(ctx, context)) {
                report.conflicts.scenes[label] = [...parent_contexts]
                break
            }
        }
        start_context = context
    }
    let end_context = end_contexts.get(label);
    if (!isContextFull(end_context)) {
        end_context = contextUnion(end_context, start_context);
        end_contexts.set(label, end_context);
    }
    return start_context;
}

//#endregion ###################################################################
//#region                              Main
//##############################################################################

/**
 * 
 * @param {Map<string, {file: string, lines: Array<string>}} scenes
 * @param {Array<string>} lines 
 * @param {Object} report
 */
function postProcess(scenes, report) {

    /** @type {Map<string, {graphics: {bg: boolean, l:boolean, c:boolean, r:boolean}, track: boolean, waveloop: boolean, monocro: boolean}>} */
    const startContexts = new Map()
    /** @type {Map<string, {graphics: {bg: string, l:string, c:string, r:string}, track: string, waveloop: string, monocro: string}>} */
    const endContexts = new Map()

    for (const [label, {file, lines}] of scenes.entries()) {
        filterEmptyLines(lines)
        pipesToEllipsis(lines)
        splitInstructions(lines)
        replaceColorImages(lines)

        if (specificFixes.hasOwnProperty(label)) {
            specificFixes[label](label, lines)
        }
        if (file != LOGIC_FILE) {
            const {start, end} = extractContexts(lines)
            startContexts.set(label, start)
            endContexts.set(label, end)
        }
    }
    const tree = getFlowchart(scenes, {'openning': {before: ['f20']}, 'eclipse': {}})

    report.conflicts = {
        info: "Conflicts when deducting start contexts",
        scenes: {}
    }
    report.appliedContexts = {
        info: "contexts applied to scenes",
        scenes: {}
    }
    for (const label of tree.keys()) {
        const startContext = startContexts.get(label);
        let appliedContext = getStartContext(label, tree, endContexts, startContexts, report);
        appliedContext = contextDiff(startContext, appliedContext);
        if (Object.getOwnPropertyNames(appliedContext).length > 0) {
            addContext(appliedContext, label, scenes.get(label).lines);
            report.appliedContexts.scenes[label] = appliedContext;
        }
    }
    //TODO process scenes in order, use added start context when calculating end context
}

//#endregion

export {
    postProcess 
}