import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

export const outputPathPrefix = path.resolve(import.meta.dirname, '../../../../public/static')
export const fullscripts = fs.readdirSync(outputPathPrefix, { withFileTypes: true })
	.filter(entry => entry.isDirectory())
	.flatMap(({ name: folder }) => fs.readdirSync(path.join(outputPathPrefix, folder, 'sources'))
		.filter(filename => filename.startsWith('fullscript_') && filename.endsWith('.txt'))
		.map(filename => [folder, filename]))

const require = createRequire(import.meta.url)

export function loadLangPreprocess(folder: string): Record<string, any> {
	const modulePath = path.join(outputPathPrefix, folder, 'preprocess.js')
	return fs.existsSync(modulePath) ? require(modulePath) : {}
}
