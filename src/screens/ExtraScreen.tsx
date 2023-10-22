import { Link } from 'react-router-dom'
import '../styles/extra.scss'
import { motion } from 'framer-motion'
import strings, { imageUrl, useLanguageRefresh } from '../utils/lang'
import { SCREEN, useScreenAutoNavigate } from '../utils/display'
import { settings } from '../utils/variables'
import { findImageObjectByName } from '../utils/gallery'
import { useState, useEffect } from 'react'

const GALLERY_IMG_NB = 8

const ExtraScreen = () => {
  useScreenAutoNavigate(SCREEN.EXTRA)
  useLanguageRefresh()
  
// get random, non sensitives images
  const [galleryImgs, setGalleryImgs] = useState<string[]>([])

  useEffect(()=> {
    setGalleryImgs(settings.eventImages
      .filter(image => !findImageObjectByName(image)?.sensitive)
      .sort(() => Math.random() - 0.5)
      .slice(0, GALLERY_IMG_NB))
  }, [])
  
  return (
    <motion.div
      className="page" id="extra"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <h2 className="page-title">{strings.title.extra}</h2>

        <main>
          <section id="extra-gallery">
            <Link to={SCREEN.GALLERY} className="page-link">{strings.extra.gallery}</Link>

            <div className="gallery-previews">
              {galleryImgs.map((image, index) =>
                <img key={index} src={imageUrl(image, "thumb")} alt="event" draggable={false} />
              )}

              {/* Placeholders */}
              {Array(Math.max(0, GALLERY_IMG_NB - galleryImgs.length)).fill(0).map((_, index) =>
                <div className="placeholder" key={index} />
              )}
            </div>
          </section>
          
          <section>
            <Link to={SCREEN.ENDINGS} className="page-link">{strings.extra.endings}</Link>
          </section>

          <section id="extra-scenes">
            <Link to="#" className="page-link">Scenes</Link>
            <div>Coming soon</div>
          </section>
        </main>

        <Link to={SCREEN.TITLE} className="menu-btn back-button">{strings.back}</Link>
      </div>
    </motion.div>
  )
}

export default ExtraScreen