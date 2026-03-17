
/**
 * Make changes to the raw script of Tsukihime, before the conversion.
 * @param {string} text complete script text
 * @returns {string|null} the changed script, or null if no change was made
 */
function th_raw_fixes(text) {
    
    text = text.replaceAll(/ò(?=[a-fA-F\d]{6})/g, '#')
    let searchText = `\` Ha HAHAHA HAHAHAHAHAHA\\`
    let i = text.indexOf(searchText)
    if (i < 0)
        throw Error(`cannot find anchor of s404 to add missing playstop`)
    i += searchText.length
    text = text.substring(0, i) + '\nplaystop\n' + text.substring(i)
    return text
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
    s121: [[20, 66]], // from page 20 to page 66,
    s122: [36],
    //s180: [[33, 59]], // already cut in the translation
    //s182: [[4, 24]], // already cut in the translation
    s193: [[60, 188]],
    s289: [[61, 64]],
    s293: [[22, 25]], // same lines as s289
    s294: [[16, 26]],
    s302: [[120, 128]],
    s374: [[64, 158], [170, 212]],
    s402: [[16, 25],  [352, 390]],
    //s403: TBD
    s404: [[6, 15]],
    s409: [[122, 251]],
    s425: [[36, 176]],
    s504: [[18, 180]]
}

export {
    th_raw_fixes,
    block_fixes,
    eroskip_pages,
}