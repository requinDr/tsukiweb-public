import { processImages } from '../../tsukiweb-common/tools/transform-sprites/processor.ts'
import { logger } from '../../tsukiweb-common/tools/utils/logger.ts'
import fs from 'fs/promises'

/**
 * 1) Place the "tachi" folder next to this script, containing the original tachi images.
 * 2) Run the script to process the images and generate transparent sprites
 */

const inputDir = './tachi'

async function main() {
	try {
		logger.section('Applying transparency to sprites')
		
		const tempDir = inputDir + '_temp'
		await fs.rename(inputDir, tempDir)

		await processImages(tempDir, inputDir)

		await fs.rm(tempDir, { recursive: true })

		logger.log('Done ✓')
	} catch (error) {
		logger.error(`An error occurred: ${(error as Error).message}`)
	}
}

main()