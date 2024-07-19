import { Fragment, useMemo, useRef, useState } from 'react'
import '../styles/gallery.scss'
import { settings } from '../utils/settings'
import { AnimatePresence, Variants, motion } from 'framer-motion'
import { findImageByRoute, GALLERY_IMAGES, GalleryImg, getImageVariants, imagePath } from '../utils/gallery'
import { strings } from "../translation/lang"
import { imageSrc } from '../translation/assets'
import { SCREEN } from '../utils/display'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate'
import MenuButton from '@tsukiweb-common/ui-core/components/MenuButton'
import { Tab } from '@tsukiweb-common/ui-core/components/TabsComponent'
import PageTabsLayout from '@tsukiweb-common/ui-core/layouts/PageTabsLayout'
import PageSection from '@tsukiweb-common/ui-core/layouts/PageSection'
import useQueryParam from '@tsukiweb-common/hooks/useQueryParam'
import classNames from 'classnames'
import "yet-another-react-lightbox/styles.css";
import Lightbox, { SlideImage } from 'yet-another-react-lightbox'
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { CharId } from 'types'
import { MdPhotoLibrary } from 'react-icons/md'
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";

type GalleryItem = GalleryImg & {src_thumb: string, src_hd: string}

const container: Variants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.5
		}
	}
}


const isUnlocked = (image: GalleryImg) =>
	settings.eventImages.includes(imagePath(image.img)) || settings.unlockEverything

const GalleryScreen = () => {
	useScreenAutoNavigate(SCREEN.GALLERY)
	useLanguageRefresh()
	const [selectedTab, setSelectedTab] = useQueryParam<CharId>("tab", "ark")
	const refSection = useRef<HTMLDivElement>(null)

	const tabImages: GalleryItem[] = useMemo(() => {
		refSection.current?.scrollTo(0, 0)

		let imagesTmp: GalleryImg[] = findImageByRoute(selectedTab)
		if (imagesTmp == undefined) {
			console.error(`unknown character ${selectedTab}`)
			return []
		}

		// filter out images that are alternatives of .filter(image => !image.alternativeOf)
		// if the non-alternative image is not unlocked, show the alternative
		imagesTmp = imagesTmp.filter(image =>
			!image.alternativeOf
			|| !isUnlocked(GALLERY_IMAGES[image.alternativeOf])
		)

		//remove non-alternative version of image image we kept the alternative
		imagesTmp = imagesTmp.filter(image =>
			image.alternativeOf || !imagesTmp.find(i => i.alternativeOf === image.img)
		)
		
		const galleryItems = imagesTmp.map((image: GalleryImg) => {
			const name = imagePath(image.img)
			const [thumb, hd] = isUnlocked(image)
									? [imageSrc(name, 'thumb'), imageSrc(name, 'hd')]
									: [null, null]

			return {...image, src_thumb: thumb, src_hd: hd} as GalleryItem
		})

		return galleryItems
	}, [selectedTab, settings.eventImages, settings.unlockEverything])

	const tabs: Tab[] = ['ark','cel','aki','his','koha'].map(char => ({
		label: strings.characters[char as CharId],
		value: char
	}))

	return (
		<motion.div
			className="page" id="gallery"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<PageTabsLayout
				title={strings.extra.gallery}
				tabs={tabs}
				selectedTab={selectedTab}
				setSelectedTab={setSelectedTab}
				backButton={
					<MenuButton to={SCREEN.TITLE} className="back-button">
						{strings.back}
					</MenuButton>
				}
			>				
				<PageSection ref={refSection}>
					<div className='gallery-transition'>
						<AnimatePresence mode="popLayout">
							<motion.div
								key={selectedTab}
								variants={container}
								initial="hidden"
								animate="show"
								exit="hidden"
								className="gallery-container">
								{tabImages?.map((image) =>
									<Fragment key={image.img}>
										{image.src_thumb === null ?
											<div className="placeholder" />
										:
											<GalleryImage
												image={image}
												blurred={image.sensitive && settings.blurThumbnails}
											/>
										}
									</Fragment>
								)}
							</motion.div>
						</AnimatePresence>
					</div>
				</PageSection>
			</PageTabsLayout>
		</motion.div>
	)
}

export default GalleryScreen


type GalleryImageProps = {
	image: GalleryItem
	blurred?: boolean
}
const GalleryImage = ({image, blurred = false}: GalleryImageProps) => {
	const [open, setOpen] = useState(false)
	const {src_thumb} = image
	const variants = getImageVariants(image.alternativeOf ? GALLERY_IMAGES[image.alternativeOf].img : image.img)
	const unlockedImages = variants?.filter(image => isUnlocked(image))

	const slides: SlideImage[] = useMemo(() => {
		return variants.map(image =>
			isUnlocked(image) ?
			({src: imageSrc(imagePath(image.img), 'hd'), alt: image.img})
			: ({src: ""})
		)
	}, [unlockedImages])

	return (
		<>
		<button
			title={image.img}
			onClick={() => setOpen(true)}
			className={classNames({blur: blurred})}>
			<img
				src={src_thumb}
				className={classNames("thumb", {"is-alternative": image.alternativeOf})}
				alt={`event ${image.img}`}
				draggable={false}
				fetchpriority={blurred ? 'low' : 'auto'}
			/>
			{variants?.length > 1 &&
				<div className="alternative">
					{variants.length} <MdPhotoLibrary />
				</div>
			}
		</button>
		
		<Lightbox
			slides={slides}
			open={open}
			close={() => setOpen(false)}
			controller={{
				closeOnPullUp: true,
			}}
			plugins={[Zoom, Thumbnails]}
			render={{
				buttonZoom: () => <></>,
				thumbnail: ({slide}) => {
					if (slide.src === "") {
						return (
							<div className="placeholder" />
						)
					}
					return (
						<img
							src={slide.src}
							alt={slide.alt}
							draggable={false}
							fetchpriority="low"
							style={{objectFit: "contain", width: "100%", height: "100%"}}
						/>
					)
				}
			}}
			carousel={{
				finite: true,
			}}
		/>
		</>
	)
}