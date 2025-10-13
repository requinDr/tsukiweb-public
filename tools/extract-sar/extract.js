import { promises as fs } from 'fs'
import path from 'path'
import { logProgress } from '../utils/logging.js'

export async function extractSar(archivePath = 'arc.sar', outputDir = 'output') {
  try {
    const buffer = await fs.readFile(archivePath)

    // Read file count (2 bytes Big Endian)
    const fileCount = buffer.readUInt16BE(0)
    
    // Read base offset (4 bytes Big Endian)
    const baseOffset = buffer.readUInt32BE(2)
    
    // console.log(`Archive contains ${fileCount} files.`)
    // console.log(`Data base offset: ${baseOffset} (0x${baseOffset.toString(16)})`)

    await fs.mkdir(outputDir, { recursive: true })
    // console.log(`Files will be extracted to: ${outputDir}\n`)

    // Index starts at offset 6 (after 2 bytes count + 4 bytes base offset)
    let currentIndexOffset = 6
    let extractedFiles = 0

    for (let i = 0; i < fileCount; i++) {
      // 1. Read filename (null-terminated string)
      const filenameEndOffset = buffer.indexOf('\0', currentIndexOffset)
      if (filenameEndOffset === -1) {
        // console.warn(`Unable to find end of filename for entry ${i + 1}`)
        break
      }

      const filename = buffer.subarray(currentIndexOffset, filenameEndOffset).toString('ascii').trim()
      currentIndexOffset = filenameEndOffset + 1

      // 2. Read relative offset (4 bytes Big Endian)
      const relativeOffset = buffer.readUInt32BE(currentIndexOffset)
      currentIndexOffset += 4

      // 3. Read file size (4 bytes Big Endian)
      const fileSize = buffer.readUInt32BE(currentIndexOffset)
      currentIndexOffset += 4

      // 4. Calculate absolute offset
      const fileOffset = baseOffset + relativeOffset

      // Validation
      if (fileOffset >= buffer.length || fileSize > buffer.length || fileSize === 0 || fileOffset + fileSize > buffer.length) {
        console.warn(`\nInvalid entry ${i + 1}/${fileCount}.`)
        break
      }

      if (!filename) {
        continue
      }

      extractedFiles++

      logProgress(`Extracting file: ${i + 1}/${fileCount} (${filename})`)

      // 5. Extract data and write file
      const fileData = buffer.subarray(fileOffset, fileOffset + fileSize)
      const outputPath = path.join(outputDir, filename)

      const outputSubDir = path.dirname(outputPath)
      if (outputSubDir !== '.' && outputSubDir !== outputDir) {
        await fs.mkdir(outputSubDir, { recursive: true })
      }
      
      await fs.writeFile(outputPath, fileData)
    }

    logProgress(`Extraction complete: ${extractedFiles}/${fileCount} files extracted to "${outputDir}"\n`)

  } catch (error) {
    console.error("\nAn error occurred during extraction:", error)
  }
}
