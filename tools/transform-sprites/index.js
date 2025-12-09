import path from 'path'
import { fileURLToPath } from 'url'
import { processImages } from '../../tsukiweb-common/tools/transform-sprites/processor.js'
import { logError } from '../../tsukiweb-common/tools/utils/logging.js'

// 1) Run once to create the input and output directories
// 2) Place the jpg images in the "input" folder
// 3) Run the script to process the images

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const inputDir = path.join(__dirname, 'input')
const outputDir = path.join(__dirname, 'output')

async function main() {
	try {
		console.log('--- Starting image transparency processing ---\n')
		await processImages(inputDir, outputDir)
		console.log('\n--- Image transparency processing finished ---')
	} catch (error) {
		logError(`An error occurred: ${error.message}`)
	}
}

main()