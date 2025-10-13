import { logError } from '../utils/logging.js'
import { extractSar } from './extract.js'

// 1) Place arc.sar in the "tools/extract-sar" folder
// 2) Run the script to extract the files

const archivePath = 'arc.sar'
const outputDir = 'output'

async function main() {
	try {
		console.log('--- Starting archive extraction ---\n')
		await extractSar(archivePath, outputDir)
		console.log('\n--- Archive extraction finished ---')
	} catch (error) {
		logError(`An error occurred: ${error.message}`)
	}
}

main()