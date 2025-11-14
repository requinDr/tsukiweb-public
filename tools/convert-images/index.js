import path from 'path'
import { fileURLToPath } from 'url'
import { processImages } from './processor.js'

// Put in the input folder bg, event and tachi folders.
// Put in the input_x2 folder bg, event and tachi folders (upscaled).
// Generate images_thumb and images directories.

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const inputDir = path.join(__dirname, 'input')
const inputDirtX2 = path.join(__dirname, 'input_x2')
const outputDir = path.join(__dirname, 'output')

const thumbOutputDir = path.join(outputDir, 'images_thumb')
const imageX2OutputDir = path.join(outputDir, 'images')


const thumbOptions = {
  resize: {
    width: 200,
    kernel: 'lanczos3',
  },
  avif: {
    quality: 60,
    alphaQuality: 50,
    effort: 8,
    chromaSubsampling: '4:4:4',
  }
}

const imageX2Options = {
  avif: {
    quality: 60,
    alphaQuality: 70,
    effort: 8,
    chromaSubsampling: '4:4:4',
  }
}


async function main() {
  try {
    console.log('--- Starting image conversion ---\n')

    const conversionPromises = [
      processImages(inputDir, thumbOutputDir, thumbOptions),
      processImages(inputDirtX2, imageX2OutputDir, imageX2Options)
    ]
    await Promise.all(conversionPromises)

    console.log('\n--- Image conversion finished ---')
  } catch (error) {
    console.error('An error occurred during image processing:', error)
    process.exit(1)
  }
}

main()