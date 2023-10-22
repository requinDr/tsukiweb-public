import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Fancybox from "../components/Fancybox"
import '../styles/gallery.scss'
import { settings } from '../utils/variables'
import { motion } from 'framer-motion'
import { GALLERY_IMAGES, GalleryImg } from '../utils/gallery'
import strings, { imageUrl, useLanguageRefresh } from '../utils/lang'
import { SCREEN, useScreenAutoNavigate } from '../utils/display'
import TabsComponent from '../components/TabsComponent'

type CharacterId = keyof typeof GALLERY_IMAGES
type GalleryItem = GalleryImg & {src_thumb: string, src_hd: string}

const defaultThumbnail = imageUrl("notreg", "thumb")

const GalleryScreen = () => {
  useScreenAutoNavigate(SCREEN.GALLERY)
  useLanguageRefresh()
  const [selected, setSelected] = useState<CharacterId>("ark")
  const [images, setImages] = useState<GalleryItem[]>([])

  useEffect(()=> {
    let imagesTmp: any[] = GALLERY_IMAGES[selected]
    if (imagesTmp == undefined)
      throw Error(`unknown character ${selected}`)
    
    imagesTmp = imagesTmp.map((image: GalleryImg) => {
      const name = `event/${image.img}`
      const [thumb, hd] = settings.eventImages.includes(name) || window.unlock
                  ? [imageUrl(name, 'thumb'), imageUrl(name, 'hd')]
                  : [defaultThumbnail, undefined]

      return {...image, src_thumb: thumb, src_hd: hd}
    })

    setImages(imagesTmp)

    document.querySelector('.gallery-container')?.scrollTo(0, 0)
  }, [selected])

  return (
    <motion.div
      className="page" id="gallery"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <h2 className="page-title">{strings.extra.gallery}</h2>
        
        <main>
          <TabsComponent tabs={Object.keys(GALLERY_IMAGES) as Array<CharacterId>}
            selected={selected} setSelected={setSelected}
            textModifier={text => strings.characters[text as CharacterId]} />

          <Fancybox className='gallery-container'
            options={{
              Thumbs: false,
              Toolbar: false,
            }}>
            {images.map(({src_hd, src_thumb, ...image}) =>
              <React.Fragment key={image.img}>
                {src_thumb === defaultThumbnail ?
                  <div className="placeholder" />
                :
                  <a href={src_hd} data-fancybox="gallery"
                    className={image.sensitive && settings.blurThumbnails ? 'blur' : ''}>
                    <img src={src_thumb} alt={`event ${image.img}`} draggable={false} />
                  </a>
                }
              </React.Fragment>
            )}
          </Fancybox>
        </main>
        
        <Link to={SCREEN.TITLE} className="menu-btn back-button">{strings.back}</Link>
      </div>
    </motion.div>
  )
}

export default GalleryScreen