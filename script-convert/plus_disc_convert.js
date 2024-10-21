
import fs from 'fs';
import path from 'path';

// <key>( ?= ?<value>)?
const kagArgRegexp = /\s*(?<key>[^\s=]+)(\s*=\s*(?<val>\w+|"[^"]*"))?/

/**
 * @param {string} cmdString 
 * @returns {[string, Map<string, string|null>]}
 */
function extractCommand(cmdString) {
    const splitIndex = cmdString.indexOf(/\s|$/);
    const cmd = cmdString.substring(0, splitIndex);
    const argsString = cmdString.substring(splitIndex+1);
    const args = new Map()
    if (argsString.length > 0) {
        let m;
        while ((m = kagArgRegexp.exec(argsString)) !== null) {       
            args.set(m.groups['key'], m.groups['val'] ?? null);
        }
    }
    return [cmd, args];
}

function processBg(args) {
    const file = args.get('file')
    const vague = args.get('vague') // TODO width (in px) of the opacity gradient
    const rule = args.get('rule')
    const time = args.get('time')
    switch(rule) {
        case 'カーテン上から' : //TODO store down
        case 'カーテン下から' : //TODO store up
        case 'カーテン右から' : //TODO store right
        case 'カーテン左から' : //TODO store left
        case 'シャッター左から' : //TODO
        case 'シャッター上から' : //TODO
        case 'シャッター下から' : //TODO
        case '集中線2' : //TODO
        case '円形(中から外へ・下)' : //TODO
        case '円形(中から外へ)' : //TODO
    }
}

/**
 * @param {string} cmd 
 * @param {Map<string, string>} args 
 */
function processLd(cmd, args) {
    let pos   = args.get('pos')
    let file  = args.get('file')
    let vague = args.get('vague')
    let rule  = args.get('rule')
    let time  = args.get('time')
    switch(cmd) {
        case 'ld' : //TODO
        case 'ld_auto' : //TODO
        case 'ld_notrans' : //TODO
    }
    if (file.startsWith('志貴'))
        file = "shiki" + file.substring(2)
    else if (file.startsWith('瀬尾'))
        file = "akira" + file.substring(2)
    else if (file.match(/[st]\d{2}/)) {
        c = file.charAt(0)
        n = Number.parseInt(file.substring(1))
        //TODO
        // s01 .. s17 (name conflict with some waves -_-)
        // t01 .. t07
    }
    else switch(file) {
        case 'black'  : break; //TODO
        case 'fin'    : break; //TODO
        case 'fly'    : break; //TODO
        case 'genshi' : break; //TODO
        case 'matu'   : break; //TODO
        case 'next'   : break; //TODO
        case 'tea'    : break; //TODO
        case 'three'  : break; //TODO
        case 'two'    : break; //TODO
        case 'white'  : break; //TODO
        case 'yumizuka' : break; //TODO
    }
    
}

function translateCommand(command) {
    const [cmd, args] = extractCommand(command);
    switch (cmd) {
        case 'l'  : return '@';
        case 'r'  : return 'br';
        case 'pg' : return null; //ignore, all @page are right before *page
        case 'cm' : return null; //ignore, all @cm are right before *page
        case 'ct' : return '\\'; // only page break command not before *page.
        case 'bg' : return processBg(args);
        case 'ld' : return processLd(args);
        case 'ld_auto'    : return processLd(args);
        case 'ld_notrans' : return processLd(args);
    }
}

function translateTextLine(line) {
    let i = 0
    let resultLine = ''
    while ((cmdIndex = line.indexOf('[', i)) >= 0) {
        resultLine += line.substring(i, cmdIndex)
        i = line.indexOf(']', cmdIndex)+1
        const cmdStr = line.substring(cmdIndex+1, i-1);
        const [cmd, args] = extractCommand(cmdStr);
        switch (cmd) {
            case 'l' :
                textBefore += '@';
                break;
            case 'r' :
                if (i != line.length)
                    throw Error(`unexpected [r] before end of line`);
                break;
            case 'graph' :
                const id = args.get('storage');
                switch(id) {
                    case 'heart' : textBefore += '♥'; break;
                    default : throw new Error(`Unexpected graph storage value ${id}`);
                }
                break;
            case 'ruby' :
                if (!args.has('char')) {
                    args.set('char', line[i]);
                    i++;
                }
                const rubyTxt = args.get('text').replace('"', '\\"')
                const rubyChars = args.get('char')
                resultLine += `[ruby="${rubyTxt}"]${rubyChars}[/ruby]`
                break;
            default : throw new Error(`Unexpected inline command ${cmdStr}`);
        }
    }
    return resultLine + line.substring(i)

}

function translateLine(line, index) {
    if (line.length == 0)
        return ''
    if (line.startsWith('@')) {
        return translateCommand(line.substring(1))
    } else if (line.startsWith('*')) {
        if (index == 0)
            return ''
        else
            return '\\'
    } else {

    }
}

function main() {
	const inputDir = './pd_ks';
	const outputDir = './scenes';
    const scenes = {
        'pd_alliance.txt'  : '幻視同盟.ks',
        'pd_geccha.txt'    : 'げっちゃ.ks',
        'pd_geccha2.txt'   : '真・弓塚夢想3.ks',
        'pd_experiment.txt': 'きのこ名作実験場.ks'
    }

    for(let [output_name, input_name] of Object.entries(scenes)) {
        input_path = path.join(inputDir, input_name)
        const lines = fs.readFileSync(input_path, 'utf-8').split(/\r?\n/);
        for (let [i, line] of lines.entries()) {
            
        }
    }

}
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