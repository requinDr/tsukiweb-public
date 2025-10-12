import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import sharp from 'sharp'
import { logError, logProgressLines } from '../utils/logging.js'

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
 * @param {object} outputDir
 * @param {object} options
 */
export async function processImages(inputDir, outputDir, options) {
  const imagePaths = await findImageFiles(inputDir)

  if (imagePaths.length === 0) {
    logError('No images found to process in ' + inputDir)
    return
  }

  const numCores = os.cpus().length
  const concurrencyLimit = Math.max(1, numCores - 1)
  let processedCount = 0
  const totalImages = imagePaths.length

  logProgressLines(outputDir, `Processing ${outputDir}: 0/${totalImages}`)

  const processQueue = async (paths) => {
    const worker = async () => {
      while (paths.length > 0) {
        const imagePath = paths.shift()
        if (!imagePath) continue

        const relativePath = path.relative(inputDir, imagePath)
        const parsedPath = path.parse(relativePath)
        const outputRelativePath = path.join(parsedPath.dir, `${parsedPath.name}.avif`)
        const outputFile = path.join(outputDir, outputRelativePath)

        try {
          await convertImage(imagePath, outputFile, options)
          processedCount++
          logProgressLines(outputDir, `Processing ${outputDir}: ${processedCount}/${totalImages}`)
        } catch (error) {
          logError(`Error converting ${imagePath} to ${outputFile}:`, error)
        }
      }
    }

    const workers = Array.from({ length: concurrencyLimit }, () => worker())
    await Promise.all(workers)
  }

  await processQueue([...imagePaths])
}
