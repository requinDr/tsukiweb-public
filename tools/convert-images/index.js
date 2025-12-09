import path from 'path'
import { processImages } from '../../tsukiweb-common/tools/convert-images/processor.js'

// Put in the input folder bg, event and tachi folders.
// Put in the input_x2 folder bg, event and tachi folders (upscaled).
// Generate images_thumb and images directories.

const outputDir = "../../public/static/jp/"

const thumbInputDir = 'input'
const thumbOutputDir = path.join(outputDir, 'images_thumb')
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

const inputDirX2 = 'input_x2'
const outputDirX2 = path.join(outputDir, 'images')
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

    await processImages(thumbInputDir, thumbOutputDir, thumbOptions)
    await processImages(inputDirX2, outputDirX2, imageX2Options)

    console.log('\n--- Image conversion finished ---')
  } catch (error) {
    console.error('An error occurred during image processing:', error)
    process.exit(1)
  }
}

main()