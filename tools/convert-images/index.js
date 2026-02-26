import path from 'path'
import { processImages } from '../../tsukiweb-common/tools/convert-images/processor.js'
import { mergeImages } from '../../tsukiweb-common/tools/convert-images/editor.js'

// Put in the input folder bg, event and tachi folders.
// Put in the input_x2 folder bg, event and tachi folders (upscaled).
// Generate images_thumb and images directories.

const outputDir = "../../public/static/jp/"

const thumbConfig = {
  input: {
    dir: 'input'
  },
  output: {
    dir: path.join(outputDir, 'images_thumb'),
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
}

const x2Config = {
  dir: path.join(outputDir, 'images'),
  input: {
    dir: 'input_x2'
  },
  output: {
    avif: {
      quality: 60,
      alphaQuality: 70,
      effort: 8,
      chromaSubsampling: '4:4:4',
    }
  }
}


async function main() {
  try {
    console.log('--- Starting image conversion ---\n')

    await mergeImages(
      path.join(thumbConfig.input.dir, 'event', 'cel_e06a.jpg'),
      path.join(thumbConfig.input.dir, 'event', 'cel_e06b.jpg'),
      path.join(thumbConfig.input.dir, 'event', 'cel_e06.jpg')
    )
    await mergeImages(
      path.join(thumbConfig.input.dir, 'event', 'koha_h06a.jpg'),
      path.join(thumbConfig.input.dir, 'event', 'koha_h06b.jpg'),
      path.join(thumbConfig.input.dir, 'event', 'koha_h06.jpg')
    )
    await processImages(thumbConfig.input.dir, thumbConfig.output.dir, thumbConfig.output)

    await mergeImages(
      path.join(x2Config.input.dir, 'event', 'cel_e06a.png'),
      path.join(x2Config.input.dir, 'event', 'cel_e06b.png'),
      path.join(x2Config.input.dir, 'event', 'cel_e06.png')
    )
    await mergeImages(
      path.join(x2Config.input.dir, 'event', 'koha_h06a.png'),
      path.join(x2Config.input.dir, 'event', 'koha_h06b.png'),
      path.join(x2Config.input.dir, 'event', 'koha_h06.png')
    )
    await processImages(x2Config.input.dir, x2Config.output.dir, x2Config.output)

    console.log('\n--- Image conversion finished ---')
  } catch (error) {
    console.error('An error occurred during image processing:', error)
    process.exit(1)
  }
}

main()