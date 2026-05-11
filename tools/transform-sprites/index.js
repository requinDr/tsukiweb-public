import { processImages } from '../../tsukiweb-common/tools/transform-sprites/processor.js'
import { logError } from '../../tsukiweb-common/tools/utils/logging.js'
import fs from 'fs/promises'

/**
 * 1) Place the "tachi" folder next to this script, containing the original tachi images.
 * 2) Run the script to process the images and generate transparent sprites
 */

const inputDir = './tachi'

async function main() {
	try {
		console.log('--- Starting image transparency processing ---\n')
		
		const tempDir = inputDir + '_temp'
		await fs.rename(inputDir, tempDir)

		await processImages(tempDir, inputDir)

		await fs.rm(tempDir, { recursive: true })

		console.log('\n--- Image transparency processing finished ---')
	} catch (error) {
		logError(`An error occurred: ${error.message}`)
	}
}

main()