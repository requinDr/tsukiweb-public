
/**
 * Make changes to the raw script of Tsukihime, before the conversion.
 * @param {string} text complete script text
 * @returns {string|null} the changed script, or null if no change was made
 */
function th_raw_fixes(text) {
    return null;
}

/**
 * Make changes on blocks (both for Tsukihime and Plus-Disc) that are easier to
 * do here than on the raw text. The chages are performed after
 * all automatic fixes. Commands can be inserted as text, they will be
 * converted to tokens afterwards.
 * @type {Record<string, (tokens: Token[])=>void>}
 */
const block_fixes = {
    //scene: (tokens)=> { //token changes.}
}

/**
 * List the start and end pages at which eroskips must be placed in each scenes.
 * `eroskip {end-start}` is inserted right after the {start}th page break.
 * If the end page is ommited (only allowed for the last entry of the scene),
 * the end will be placed after the last page at the end of the scene.
 * @type {Record<string,
 *  [number] | [number, number] | [...[number, number][], [number]|[number, number]]>
 * }
 */
const eroskip_pages = {
    s118: [12], // from page 12 to the end
    s119: [22],
    s120: [36],
    s121: [[18, 63]], // from page 18 to page 63,
    s122: [36],
    s180: [[32, 56]],
    s182: [[4, 24]],
    s193: [[60, 187]],
    s289: [[53, 56]],
    s293: [[21, 23]], // same lines as s289
    s294: [[12, 46]],
    s302: [[116, 124]],
    s374: [[63, 157], [169, 211]],
    s402: [[16, 25],  [346, 386]],
    //s403: TBD
    s404: [[6, 36]],
    s409: [[118, 244]],
    s425: [[36, 175]],
    s504: [[18, 180]]
}

export {
    th_raw_fixes,
    block_fixes,
    eroskip_pages,
}