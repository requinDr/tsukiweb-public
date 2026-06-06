import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath, pathToFileURL } from 'url'

export interface ToolConfig {
  WAIFU2X_CAFFE: string
  FFMPEG: string
  PUBLIC: string
}

export interface Paths {
  repo: string
  tools: string
  publicAssets: string
  workspace: string
  archive: string
  extracted: string
  input: string
  inputX2: string
  inputBg: string
  inputTachi: string
  inputX2Bg: string
  inputX2Tachi: string
  convertScriptsTool: string
  images: string
  imagesThumb: string
  imagesBg: string
  imagesTachi: string
  wavePd: string
}

export const ORCHESTRATOR_DIR = path.dirname(fileURLToPath(import.meta.url))
export const TOOLS_DIR = path.resolve(ORCHESTRATOR_DIR, '..')
export const REPO_DIR = path.resolve(TOOLS_DIR, '..')
export const CONFIG_PATH = path.join(TOOLS_DIR, 'my-config.ts')

const DEFAULT_CONFIG: ToolConfig = {
  WAIFU2X_CAFFE: 'waifu2x-caffe-cui.exe',
  FFMPEG: 'ffmpeg.exe',
  PUBLIC: '../public',
}

type PartialToolConfig = Partial<ToolConfig>

function hasCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code
}

export async function loadConfig(): Promise<ToolConfig> {
  let userConfig: PartialToolConfig = {}

  try {
    const stat = await fs.stat(CONFIG_PATH)
    const configUrl = pathToFileURL(CONFIG_PATH)
    configUrl.searchParams.set('mtime', String(stat.mtimeMs))
    const module = await import(configUrl.href)
    userConfig = { ...module, ...(module.default ?? {}) } as PartialToolConfig
  } catch (error) {
    if (!hasCode(error, 'ENOENT')) {
      throw error
    }
  }

  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
  }
}

export function resolveToolPath(value: string): string {
  if (path.isAbsolute(value)) return path.normalize(value)
  return path.resolve(TOOLS_DIR, value)
}

export function buildPaths(config: ToolConfig): Paths {
  const publicAssets = resolveToolPath(config.PUBLIC)
  const workspace = path.join(TOOLS_DIR, '_workspace_pd')
  const input = path.join(workspace, 'input')
  const inputX2 = path.join(workspace, 'input_x2')
  const images = path.join(publicAssets, 'static', 'jp', 'images')

  return {
    repo: REPO_DIR,
    tools: TOOLS_DIR,
    publicAssets,
    workspace,
    archive: path.join(TOOLS_DIR, 'helpers', 'extract-xp3', 'data.xp3'),
    extracted: path.join(workspace, 'extracted'),
    input,
    inputX2,
    inputBg: path.join(input, 'bg'),
    inputTachi: path.join(input, 'tachi'),
    inputX2Bg: path.join(inputX2, 'bg'),
    inputX2Tachi: path.join(inputX2, 'tachi'),
    convertScriptsTool: path.join(TOOLS_DIR, 'helpers', 'convert-scripts'),
    images,
    imagesThumb: path.join(publicAssets, 'static', 'jp', 'images_thumb'),
    imagesBg: path.join(images, 'bg'),
    imagesTachi: path.join(images, 'tachi'),
    wavePd: path.join(publicAssets, 'static', 'jp', 'wave_pd'),
  }
}
