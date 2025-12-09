import fs from 'fs'
import { processScenes } from '../../tsukiweb-common/tools/generate-thumbnails/processor.js'

// 1) Put in the input folder: bg, event and tachi folders.
// 2) Run to to create the spritesheet

const INPUT_SCENES = JSON.parse(fs.readFileSync('scenes-graphics.json', 'utf8'))
const INPUT_IMAGES = 'input'
const OUTPUT_THUMBNAILS = '../../public/static/jp/flowchart-spritesheet/'
const OUTPUT_METADATA = '../../src/assets/flowchart/'

async function main() {
	console.log('--- Starting thumbnail generation ---\n')
	if (!fs.existsSync(INPUT_IMAGES)) {
		console.error(`Input folder "${INPUT_IMAGES}" does not exist. Please create it and add images.`)
		process.exit(1)
	}
	await processScenes(INPUT_SCENES, INPUT_IMAGES, OUTPUT_THUMBNAILS, OUTPUT_METADATA)
	console.log('\n--- Thumbnail generation finished ---')
}

main()