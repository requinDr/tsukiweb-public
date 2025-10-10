import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

/**
 * Finds all image files in a directory.
 * @param {string} dir - Directory to search.
 * @returns {Promise<string[]>} Array of image file paths.
 */
async function findImageFiles(dir, acc = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await findImageFiles(fullPath, acc)
      } else if (/\.(png|jpe?g|webp)$/i.test(entry.name)) {
        acc.push(fullPath)
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`Input directory not found: ${dir}`)
      return acc
    }
    throw error
  }
  return acc
}

/**
 * Converts a single image according to the specified options.
 * @param {string} inputFile - The path to the input image.
 * @param {string} outputFile - The path to the output image.
 * @param {object} options - The conversion options for sharp.
 */
async function convertImage(inputFile, outputFile, options) {
  const outputDir = path.dirname(outputFile)
  await fs.mkdir(outputDir, { recursive: true })

  let image = sharp(inputFile, { limitInputPixels: false })

  if (options.resize) {
    image = image.resize(options.resize)
  }

  image = image.avif(options.avif || {})

  await image.toFile(outputFile)
}

/**
 * Processes all images in a directory based on multiple output configurations.
 * @param {string} inputDir - The root directory containing input images.
 * @param {object} outputConfigs - An object where keys are output directories and values are conversion options.
 */
export async function processImages(inputDir, outputConfigs) {
  const imagePaths = await findImageFiles(inputDir)

  if (imagePaths.length === 0) {
    console.log('No images found to process in ' + inputDir)
    return
  }

  console.log(`Found ${imagePaths.length} images to process.`)

  const conversionPromises = []

  for (const imagePath of imagePaths) {
    const relativePath = path.relative(inputDir, imagePath)
    const parsedPath = path.parse(relativePath)
    const outputRelativePath = path.join(parsedPath.dir, `${parsedPath.name}.avif`)

    for (const [outputDir, options] of Object.entries(outputConfigs)) {
      const outputFile = path.join(outputDir, outputRelativePath)
      conversionPromises.push(convertImage(imagePath, outputFile, options))
    }
  }

  await Promise.all(conversionPromises)
  console.log(`Successfully processed ${imagePaths.length} images, creating ${Object.keys(outputConfigs).length} versions for each.`)
}
