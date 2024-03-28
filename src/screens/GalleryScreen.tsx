import { Fragment, useEffect, useState } from 'react'
import Fancybox from "../components/molecules/Fancybox"
import '../styles/gallery.scss'
import { settings } from '../utils/settings'
import { motion } from 'framer-motion'
import { CharacterId, GALLERY_IMAGES, GalleryImg } from '../utils/gallery'
import { strings } from "../translation/lang"
import { imageSrc } from '../translation/assets'
import { SCREEN } from '../utils/display'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate'
import useQueryParam from '../components/hooks/useQueryParam'
import MenuButton from '@ui-core/components/MenuButton'
import TabsComponent, { Tab } from '@ui-core/components/TabsComponent'

type GalleryItem = GalleryImg & {src_thumb: string, src_hd: string}

let defaultThumbnail: string | null = null

const GalleryScreen = () => {
  useScreenAutoNavigate(SCREEN.GALLERY)
  useLanguageRefresh()
  const [selectedTab, setSelectedTab] = useQueryParam<CharacterId>("tab", "ark")
  const [images, setImages] = useState<GalleryItem[]>([])

  useEffect(()=> {
    let imagesTmp: any[] = GALLERY_IMAGES[selectedTab]
    if (imagesTmp == undefined)
      throw Error(`unknown character ${selectedTab}`)
    
    imagesTmp = imagesTmp.map((image: GalleryImg) => {
      const name = `event/${image.img}`
      const [thumb, hd] = settings.eventImages.includes(name) || window.unlock
                  ? [imageSrc(name, 'thumb'), imageSrc(name, 'hd')]
                  : [defaultThumbnail, undefined]

      return {...image, src_thumb: thumb, src_hd: hd}
    })

    setImages(imagesTmp)

    document.querySelector('.gallery-container')?.scrollTo(0, 0)
  }, [selectedTab])

  const tabs: Tab[] = Object.keys(GALLERY_IMAGES).map(char => ({
    label: strings.characters[char as CharacterId],
    value: char
  }))

  return (
    <motion.div
      className="page" id="gallery"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">        
        <main>
          <h2 className="page-title">{strings.extra.gallery}</h2>
          <TabsComponent
            tabs={tabs}
            selected={selectedTab}
            setSelected={setSelectedTab}
          />

          <Fancybox className='gallery-container'
            options={{
              Toolbar: false,
              Thumbs: false,
              closeButton: false,
            } as any}>
            {images.map(({src_hd, src_thumb, ...image}) =>
              <Fragment key={image.img}>
                {src_thumb === defaultThumbnail ?
                  <div className="placeholder" />
                :
                  <a href={src_hd} data-fancybox="gallery"
                    className={image.sensitive && settings.blurThumbnails ? 'blur' : ''}>
                    <img
                      src={src_thumb}
                      alt={`event ${image.img}`}
                      draggable={false}
                      fetchPriority={image.sensitive && settings.blurThumbnails ? 'low' : 'auto'}
                    />
                  </a>
                }
              </Fragment>
            )}
          </Fancybox>

          <MenuButton to={SCREEN.TITLE} className="back-button">
            {strings.back}
          </MenuButton>
        </main>
      </div>
    </motion.div>
  )
}

export default GalleryScreen