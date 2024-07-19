import { Fragment, useMemo, useRef, useState } from 'react'
import '../styles/gallery.scss'
import { settings } from '../utils/settings'
import { AnimatePresence, Variants, motion } from 'framer-motion'
import { CharacterId, GALLERY_IMAGES, GalleryImg } from '../utils/gallery'
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
import Lightbox from 'yet-another-react-lightbox'
import Zoom from "yet-another-react-lightbox/plugins/zoom";

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

const GalleryScreen = () => {
	useScreenAutoNavigate(SCREEN.GALLERY)
	useLanguageRefresh()
	const [selectedTab, setSelectedTab] = useQueryParam<CharacterId>("tab", "ark")
	const [index, setIndex] = useState<number>(-1)
	const refSection = useRef<HTMLDivElement>(null)

	const isUnlocked = (image: GalleryImg) =>
		settings.eventImages.includes(`event/${image.img}`) || settings.unlockEverything

	const tabImages: GalleryItem[] = useMemo(() => {
		refSection.current?.scrollTo(0, 0)

		let imagesTmp: GalleryImg[] = GALLERY_IMAGES[selectedTab]
		if (imagesTmp == undefined) {
			console.error(`unknown character ${selectedTab}`)
			return []
		}
		
		const galleryItems = imagesTmp.map((image: GalleryImg) => {
			const name = `event/${image.img}`
			const [thumb, hd] = isUnlocked(image)
									? [imageSrc(name, 'thumb'), imageSrc(name, 'hd')]
									: [null, null]

			return {...image, src_thumb: thumb, src_hd: hd} as GalleryItem
		})

		return galleryItems
	}, [selectedTab, settings.eventImages, settings.unlockEverything])

	const unlockedImages: GalleryItem[] = useMemo(() =>
		tabImages.filter(tabImages => isUnlocked(tabImages))
	, [tabImages, settings.eventImages, settings.unlockEverything])

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
				<Lightbox
					index={index}
					slides={unlockedImages.map(image => ({src: image.src_hd}))}
					open={index >= 0}
					close={() => setIndex(-1)}
					controller={{
						closeOnPullUp: true,
					}}
					plugins={[Zoom]}
					render={{
						buttonZoom: () => <></>
					}}
				/>
				
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
												onClick={() => setIndex(unlockedImages.indexOf(image))}
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
	onClick?: () => void
}
const GalleryImage = ({image, blurred = false, onClick}: GalleryImageProps) => {
	const {src_thumb} = image
	
	return (
		<button
			onClick={onClick}
			className={classNames({blur: blurred})}>
			<img
				src={src_thumb}
				alt={`event ${image.img}`}
				draggable={false}
				fetchpriority={blurred ? 'low' : 'auto'}
			/>
		</button>
	)
}