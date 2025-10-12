import fs from 'fs'
import { processScenes } from './processor.js'

// 1) Run to to create the spritesheet
// Note: static/jp/image must contain the necessary image files

const INPUT_SCENES = JSON.parse(fs.readFileSync('scenes-graphics.json', 'utf8'))
const INPUT_IMAGES = '../../public/static/jp/image/'
const OUTPUT_THUMBNAILS = '../../public/static/jp/flowchart-spritesheet/'
const OUTPUT_METADATA = '../../src/assets/flowchart/'

function main() {
	processScenes(INPUT_SCENES, INPUT_IMAGES, OUTPUT_THUMBNAILS, OUTPUT_METADATA)
}

main()