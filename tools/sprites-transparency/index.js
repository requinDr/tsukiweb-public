import { processImages } from './processor.js'

// 1) Run once to create the input and output directories
// 2) Place the jpg images in the "input" folder
// 3) Run the script to process the images

async function main() {
	console.log('Starting image transparency processing...')
	await processImages('input', 'output')
}

main()