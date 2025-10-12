import { processImages } from './processor.js'
import { logError } from '../utils/logging.js'

// 1) Run once to create the input and output directories
// 2) Place the jpg images in the "input" folder
// 3) Run the script to process the images

async function main() {
	try {
		console.log('--- Starting image transparency processing ---\n')
		await processImages('input', 'output')
		console.log('\n--- Image transparency processing finished ---')
	} catch (error) {
		logError(`An error occurred: ${error.message}`)
	}
}

main()