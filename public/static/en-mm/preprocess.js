
/**
 * Make changes to the raw script of Tsukihime, before the conversion.
 * @param {string} text complete script text
 * @returns {string|null} the changed script, or null if no change was made
 */
function th_raw_fixes(text) {
    return null;
}

/**
 * list the start and end pages at which eroskips must be placed in each scenes.
 * `eroskip {end-start}` is inserted right after the {start}th page break.
 * If the end page is ommited (only allowed for the last entry of the scene),
 * the end will be placed after the last page at the end of the scene.
 * @type {Record<string,
 *  number | [number, number] | [...[number, number][], number|[number, number]]>
 * }
 */
const eroskip_pages = {
    s118: [12], // from page 12 to the end
    s119: [22],
    s120: [36],
    s121: [[20, 66]], // from page 20 to page 66,
    s122: [36],
    s180: [[33, 59]],
    s182: [[4, 24]],
    s193: [[60, 190]],
    s289: [[61, 64]],
    s293: [[22, 25]], // same lines as s289
    s294: [[16, 50]],
    s302: [[120, 128]],
    s374: [[64, 158], [170, 212]],
    s402: [[16, 25],  [352, 392]],
    //s403: TBD
    s404: [[6, 36]],
    s409: [[122, 251]],
    s425: [[36, 176]],
    s504: [[18, 182]]
}

export {
    th_raw_fixes,
    eroskip_pages,
}