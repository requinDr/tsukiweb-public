import path from 'path'
import { BASE_LANG, PUBLIC_DIR, TOOLS_DIR, gameDir } from './config.ts'

export interface Paths {
  tools: string
  publicAssets: string
  workspace: string
  dataArchive: string
  img: string
  imgX2: string
  images: string
  imagesThumb: string
  wave: string
}

export function buildPaths(): Paths {
  const workspace = path.join(TOOLS_DIR, '_workspace_pd')
  const staticJp = path.join(PUBLIC_DIR, 'static', BASE_LANG)

  return {
    tools: TOOLS_DIR,
    publicAssets: PUBLIC_DIR,
    workspace,
    dataArchive: path.join(gameDir(), 'data.xp3'),
    img: path.join(workspace, BASE_LANG, 'img'),
    imgX2: path.join(workspace, BASE_LANG, 'img_x2'),

    //output
    images: path.join(staticJp, 'images'),
    imagesThumb: path.join(staticJp, 'images_thumb'),
    wave: path.join(staticJp, 'wave_pd'),
  }
}
