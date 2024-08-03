/**
 * Convert a script file into a folder of scenes in the format
 * used by the parser.
 */
import fs from 'fs';
import path from 'path';
import { extractScript } from './scenes-extract.js';
import { postProcess } from './post-process.js';


const LOGIC_FILE = "scene0"

//if not exist create a folder "scenes"
function createDir(dirName) {
	if (!fs.existsSync(dirName)) {
		fs.mkdirSync(dirName);
	}
}


function main() {
	const inputFile = './fullscript.txt';
	const outputDir = './scenes';

	const lines = fs.readFileSync(inputFile, 'utf-8').split(/\r?\n/);
	createDir(outputDir);

	let scenes = extractScript(lines)
	const report = {}
	postProcess(scenes, report)
	fs.writeFileSync(path.join(outputDir, '.log.json'), JSON.stringify(report, undefined, 2))
	/**@type {Map<string, Array<string>>} */
	const fileContents = new Map()
	for (let [_label, {file, lines}] of scenes.entries()) {
		if (!fileContents.has(file)) {
			fileContents.set(file, Array.from(lines))
		}
		else {
			fileContents.get(file).push(...lines)
		}
	}

	for (let [name, lines] of fileContents.entries()) {
		fs.writeFileSync(path.join(outputDir, `${name}.txt`), lines.join('\n')+'\n')
	}
}

main()
export { LOGIC_FILE }