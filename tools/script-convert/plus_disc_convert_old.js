
import fs from 'fs';
import path from 'path';

// <key>( ?= ?<value>)?
// a value that starts with a digit must contain only digits.
const kagArgRegexp = /\s*(?<key>[^\s=]+)(\s*=\s*(?<val>\d+|[^\s\d"][^\s"]*|"[^"]*"))?/

//##############################################################################
//region                             GRAPHICS
//##############################################################################

/**
 * @param {string} cmdString 
 * @returns {[string, Map<string, string|null>]}
 */
function extractCommand(cmdString) {
    const splitIndex = cmdString.indexOf(' ');
    if (splitIndex < 0)
        return [cmdString, new Map()]

    const cmd = cmdString.substring(0, splitIndex);
    let argsString = cmdString.substring(splitIndex+1);
    const args = new Map()
    if (argsString.length > 0) {
        let m;
        while ((m = kagArgRegexp.exec(argsString))) {
            argsString = argsString.substring(m.index + m[0].length)
            args.set(m.groups['key'], m.groups['val'] ?? null);
        }
    }
    return [cmd, args];
}

function processBg(cmd, args) {
    switch (cmd) {
        case 'black' : args.set('file', 'black'); // TODO hide text
        case 'blackout' : args.set('file', 'black'); // TODO do not hide text
        //case 'white' : args.set('file', 'white'); // TODO hide text (never used)
        case 'flushover' : args.set('file', 'white'); // TODO do not hide text
        case 'flash' : return null; // TODO used only once, must see original in-game effect and context
        case 'fadein' : break; // TODO do not hide text
    } 
    const file = processImgFile(args)
    const transition = processImgTransition(args)
    const time = args.get('time') ?? 0
    return `bg ${file},${transition},${time}`;
}

function processImgFile(args) {
    const file = args.get('file');
    if (file.startsWith('志貴')) {// 志貴_0[234]
        return "tachi/shiki" + file.substring(2);
    }
    if (file.startsWith('瀬尾')) { // 瀬尾_0[123]
        return "tachi/akira" + file.substring(2);
    }
    if (file.match(/[st]\d{2}/)) {
        const c = file.charAt(0);
        const n = Number.parseInt(file.substring(1));
        //TODO
        // s01 .. s17 (name conflict with some waves -_-)
        // t01 .. t07
        return file;
    }
    if (file.match(/(aki|ark|cel|his|kemo|koha|neko|nero|roa|stk)_t?\d+[abc]?/)) {
        return `tachi/${file}`;
    }
    if (file.match(/fake_\d+/)) {
        return `tachi/${file}`;
    }
    if (file.match(/bg_(sp\d*|\d+[abcd]?)/)) {
        return `bg/${file}`;
    }
    if (file.match(/ima_\d+b?/)) {
        switch (file) {
            case 'ima_10' : return '#000000';
            case 'ima_11' : return '#FFFFFF';
            case 'ima_11b' : return '#9C0120';
            default : return `bg/${file}`;
        }
    }
    switch (file) {
        case 'black'  : return "#000";
        case 'white'  : return "#FFF";
        case 'fin' : case 'genshi' : case 'tea' : case 'one_a' : case 'one_b' :
        case 'two' : case 'three' : return `words/pd_${file}`;
        //'$b`[right]Fin[/right]`';
        //'$b`[right][u]   閑話/幻視同盟[/u][/right]`'; //Casual Talk / Illusionary Alliance
        //'$t`[u]          月茶[/u]`'; //Geccha
        //'$c`[center]一日目/1[/center]`'; //Day 1/1
        //'$c`[center]一日目/2[/center]`'; //Day 1/2
        //'$c`[center]二日目[/center]`'; //Day 2
        //'$c`[center]三日目[/center]`'; //Day 3
        case 'yumizuka' : return 'bg/yumizuka';
        case 'スクロール19a' : return 'bg/スクロール19'; //TODO align bottom
        case 'スクロール19b' : return 'bg/スクロール19'; //TODO align top
        case 'matu'   : break; //TODO full-screen sprite. Change ld to bg
        case 'next'   : return null; // used at the end of the scene (ignore)
        case 'title_01' : return 'bg/title_01'; // used during script
        default : throw Error(`Unexpected image file ${file}`);
    }
}
function processImgTransition(args) {
    //TODO implement vague value
    let vague = args.get('vague'); // width (in px) of the opacity gradient
    let rule = args.get('rule');
    let method = args.get('method');
    if (Number.parseInt(args.get("time") ?? '0') == 0)
        return 'notrans';
    if (!rule && !method)
        method = 'crossfade';
    if (method) {
        switch (method) {
            case 'crossfade' : break;
            case 'notrans' : break;
            case 'scroll' :
                switch (args.get('from')) {
                    case 'top' : method = 'bscroll'; break; //TODO implement
                    case 'bottom' : method = 'tscroll'; break; //TODO implement
                    case 'left' : method = 'rscroll'; break; //TODO implement
                }
                break;
            default :
                throw Error(`Unexpected transition method ${method}`);
        }
    } else {
        switch (rule) {
            case 'カーテン上から'   : method = 'bcartain'; break; //curtain from top
            case 'カーテン下から'   : method = 'tcartain'; break; //curtain from bottom
            case 'カーテン右から'   : method = 'lcartain'; break; //curtain from right
            case 'カーテン左から'   : method = 'rcartain'; break; //curtain from left
            case 'シャッター上から' : method = 'bshutter'; break; //TODO shutter from top
            case 'シャッター下から' : method = 'tshutter'; break; //TODO shutter from bottom
            case 'シャッター左から' : method = 'rshutter'; break; //TODO shutter from left
            case '集中線2' : method = 'lexpl'; break; //TODO explosion on the left
            case '円形(中から外へ・下)' : method = 'lcircle'; break; //TODO circle left
            case '円形(中から外へ)' : method = 'ccircle'; break; //TODO circle center
            default :
                throw Error(`Unexpected transition rule ${rule}`);
        }
    }

    return method
}

function processSpritePos(args) {
    const pos = args.get('pos');
    switch (pos) {
        case 'a': case 'all' : return 'a';
        case 'l': case 'left' : return 'l';
        case 'r': case 'right' : return 'r';
        case 'c': case 'center' : return 'c';
        default : throw new Error(`Unknown sprite pos ${pos}`);
    }
}

/**
 * @param {string} cmd 
 * @param {Map<string, string>} args 
 */
function processLd(cmd, args) {
    switch (cmd) {
        case 'ld' : //TODO
        case 'ld_auto' : //TODO
        case 'ld_notrans' : //TODO
    }
    let file = processImgFile(args);
    let transition = processImgTransition(args);
    let pos = processSpritePos(args);
    let time  = args.get('time');
    return `ld ${pos},${file},${transition || 'none'},${time || 0}`;
}

function processCl(cmd, args) {
    switch (cmd) {
        case 'cl' : //hide text
        case 'cl_auto' : //does not hide text
        case 'cl_notrans' : // ?
    }
    let transition = processImgTransition(args);
    let pos = processSpritePos(args);
    let time  = args.get('time');
    return `cl ${pos},${transition || 'none'},${time || 0}`;
}

//endregion ####################################################################
//region                              AUDIO
//##############################################################################

/**
 * @param {string} cmd 
 * @param {Map<string, string>} args 
 * @returns {string}
 */
function processTrack(cmd, args) {
    // TODO implement fadein/out time
    let file = args.get('file') ?? args.get('storage');
    let time = args.get('time') ?? args.get('overlap') ?? 0;
    if (file) {
        if (!(file?.startsWith("TMCD-0101_")))
            throw Error(`Unexpected track name ${file}`);
        file = file.substring(file.length-2);
    }
    switch (cmd) {
        case 'play'     :
        case 'xchgbgm'  : //crossfade between tracks
            return `play "*${file}"`;
        case 'playstop' :
            return `playstop`;
        default : throw Error(`Unexpected command ${cmd}`);
    }
}

function processWave(cmd, args) {
    // TODO implement fadein/out time for wavestop and waveloop
    let file = args.get('file');
    let time = args.get('time') ?? 0;
    let nowait = (args.get('nowait') == "true");

    switch (cmd) {
        case 'wave' : return `wave ${file}`;
        case 'wavestop' : return `wavestop`;
        case 'waveloop' : return `waveloop ${file}`;
    }
}

//endregion ####################################################################
//region                             EFFECTS
//##############################################################################

function processQuake(cmd, args) {
    let h = Number.parseInt(args.get('hmax') ?? '10');
    let v = Number.parseInt(args.get('vmax') ?? '10');
    let time = args.get('time');
    switch (cmd) {
        case 'quake' :
            if (h == 0) return `quakey ${v},${time}`;
            if (v == 0) return `quakex ${h},${time}`;
            else return `quakexy ${h},${v},${time}`;
        case 'wq' : return null; // Always right after a quake. Depending on
                                 // implementation, simply replace with a delay
    }
}
//endregion ####################################################################
//region                               TEXT
//##############################################################################

function translateTextLine(line) {
    let i = 0;
    let resultLine = '`';
    let cmdIndex;
    while ((cmdIndex = line.indexOf('[', i)) >= 0) {
        resultLine += line.substring(i, cmdIndex)
        i = line.indexOf(']', cmdIndex)+1
        const cmdStr = line.substring(cmdIndex+1, i-1);
        const [cmd, args] = extractCommand(cmdStr);
        switch (cmd) {
            case 'l' :
                resultLine += '@';
                break;
            case 'r' :
                if (i != line.length)
                    throw Error(`unexpected [r] before end of line`);
                break;
            case 'graph' :
                const id = args.get('storage');
                switch (id) {
                    case 'heart' : resultLine += '♥'; break;
                    default : throw new Error(`Unexpected graph storage value ${id}`);
                }
                break;
            case 'ruby' :
                if (!args.has('char')) {
                    args.set('char', line[i]);
                    i++;
                }
                const rubyTxt = args.get('text')
                const rubyChars = args.get('char')
                resultLine += `[ruby=${rubyTxt}]${rubyChars}[/ruby]`
                break;
            default : throw new Error(`Unexpected inline command ${cmdStr}`);
        }
    }
    return resultLine + line.substring(i);
}

//endregion  ###################################################################
//region                           LINE ROUTER
//##############################################################################

function translateCommand(command) {
    const [cmd, args] = extractCommand(command);
    switch (cmd) {
        case 'l'    : return '@';
        case 'r'    : return 'br';
        case 'pg'   : return null; // all @pg are right before *page
        case 'cm'   : return null; // all @cm are right before *page
        case 'ct'   : return '\\'; // only page break command not before *page.
        case 'bg'   : return processBg(cmd, args);
        case 'fadein'   : return processBg(cmd, args);
        case 'black'    : return processBg(cmd, args);
        case 'blackout' : return processBg(cmd, args);
        case 'flash'    : return processBg(cmd, args);
        case 'flushover'    : return processBg(cmd, args); // <=> fadein file=white
        case 'ld'   : return processLd(cmd, args);
        case 'ld_auto'      : return processLd(cmd, args);
        case 'ld_notrans'   : return processLd(cmd, args);
        case 'cl'   : return processCl(cmd, args);
        case 'cl_auto'      : return processCl(cmd, args);
        case 'cl_notrans'   : return processCl(cmd, args);
        case 'bgmopt'   : return null; // used only once to change music volume
        case 'play'     : return processTrack(cmd, args);
        case 'playstop' : return processTrack(cmd, args);
        case 'xchgbgm'  : return processTrack(cmd, args);
        case 'wave' : return processWave(cmd, args);
        case 'waveloop' : return processWave(cmd, args);
        case 'wavestop' : return processWave(cmd, args);
        case 'quake'    : return processQuake(cmd, args);
        case 'wq'   : return processQuake(cmd, args);
        case 'wait' : return `wait ${args.get('time')}`;
        case 'jump' : return null; // used to go to next scene
        case 'position' : return null; // different call at the beginning of all 4 scenes. Must check consequence.
        case 'position2'    : return null; // change message layer (?)
        case 'resetposition2'   : break; // reset message layer (?)
        case 'rocket'   : return null; // TODO see in-game effect
        case 'wrocket'  : return null; // idem
        case 'textoff'  : return null; // can probably be ignored. Used around...
        case 'texton'   : return null; // ...img changes to hide and show the text.
    }
}

function translateLine(line, index) {
    if (line.length == 0)
        return '';
    switch (line.charAt(0)) {
        case '@' :
            const [cmd, args, remaining] = extractCommand(line);
            result = translateCommand(cmd, args);
            if (remaining.trim().length > 0) {
                if (Array.isArray(result))
                    result.push(translateLine(remaining, index));
                else
                    result = [result, translateLine(line, index)];
            }
            return result;
        case '*' :
            if (index == 0)
                return '';
            else
                return '\\';
        case ';' : return '';
        default : return translateTextLine(line);
    }
}

function fixErrors(language, fileName, lines) {
    switch(language) {
        case 'jp' :
            switch (fileName) {
                case '幻視同盟.ks' :
                    lines[11] = '　[ruby text="つき"]月[ruby text="ひめ"]姫[ruby text="ほん"]本[ruby text="ぺん"]編のいずれかのエンディングに[ruby text="とう"]到[ruby text="たつ"]達した[ruby text="あと"]後に、[r]'
                    lines[12] = '[ruby text="いき"]息[ruby text="ぬ"]抜きとして[ruby text="たの"]楽しんでください。'
            }
    }
}
/**
 * @param {Array<string>} lines 
 */
function preProcess(fileName, lines) {
    fixErrors(language, fileName, lines)
    for (let [i, line] of lines.entries()) {
        process.stdout.write(`${fileName}:${i}/${lines.length}\e[K\r`)
        lines[i] = translateLine(line, i)
    }
    lines.splice(0, lines.length, ...lines.flat(Infinity).filter(x => (x?.length ?? 0) > 0))
}

function postProcess(lines) {
    //1. Put '\' at the end of the previous line
    for (const [i, line] of lines.entries()) {
        if (i > 0 && line == '\\' && lines[i-1].startsWith('`')) {
            lines[i-1] += '\\'
            lines[i] = ''
        }
    }
    lines.splice(0, lines.length, ...lines.filter(x => (x?.length ?? 0) > 0))
}

//#endregion ###################################################################
//#region                              MAIN
//##############################################################################

function main() {
	const inputDir = './pd_ks';
	const outputDir = './pd_out';
    const scenes = {
        'pd_alliance.txt'  : '幻視同盟.ks',
        'pd_geccha.txt'    : 'げっちゃ.ks',
        'pd_geccha2.txt'   : '真・弓塚夢想3.ks',
        'pd_experiment.txt': 'きのこ名作実験場.ks'
    }

    for(const [output_name, input_name] of Object.entries(scenes)) {
        const input_path = path.join(inputDir, input_name)
        const lines = fs.readFileSync(input_path, 'utf-8').split(/\r?\n/);
        preProcess(input_name, lines)
        postProcess(lines)
        const output_path = path.join(outputDir, output_name)
        const dir = path.dirname(output_path)
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir)
        fs.writeFileSync(output_path,
            lines.filter(l=> l && l.length > 0).join('\n'), )
    }
    process.stdout.write(`\nDone.\e[K`)

}
main()

//#endregion
//##############################################################################

/*
X'bg',            X'bgmopt',    X'black',
X'blackout',      X'cl',        X'cl_auto',
X'cl_notrans',    X'cm',        X'ct',
~'fadein',        X'flash',     X'flushover',
X'jump',          X'l',         X'ld',
~'ld_auto',       ~'ld_notrans',X'pg',
X'play',          X'playstop',  X'position',
~'position2',     x'quake',     X'r',
~'resetposition2',!'rocket',    X'textoff',
X'texton',        X'wait',      X'wave',
X'waveloop',      X'wavestop',  X'wq',
X'wrocket',       X'xchgbgm'

Voilà la liste exhaustive des commandes utilisées dans les 5207 lignes des 4 fichiers contenant du scénario de plus-disc. Il me manque peut-être des fichiers.
Sur ces commandes, on peut déjà facilement remplacer l et r par @ et \n ; pg, cm et ct sont toutes pour le saut de page, donc \.
bg, cl, ld, play, playstop, wave, waveloop, wavestop, wait et quake portent (presque) le même nom sur les script du jeu de base.
wq ("wait quake"), texton, textoff sont inutiles.
black est équivalent à bg file=black

Il faudra convertir les arguments, et trouver l'équivalent des dernières commandes, à savoir :
'bgmopt',     'blackout',       'cl_auto',    'cl_notrans',     'fadein',
'flash',      'flushover',      'jump',
'ld_auto',    'ld_notrans',     'position',
'position2',  'resetposition2', 'rocket',
'wrocket',    'xchgbgm'
*/