import { Fragment, useMemo } from 'react'
import Fancybox from "../components/molecules/Fancybox"
import '../styles/gallery.scss'
import { settings } from '../utils/settings'
import { AnimatePresence, Variants, motion } from 'framer-motion'
import { CharacterId, GALLERY_IMAGES, GalleryImg } from '../utils/gallery'
import { strings } from "../translation/lang"
import { imageSrc } from '../translation/assets'
import { SCREEN } from '../utils/display'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate'
import useQueryParam from '../components/hooks/useQueryParam'
import MenuButton from '@ui-core/components/MenuButton'
import { Tab } from '@ui-core/components/TabsComponent'
import PageTabsLayout from '@ui-core/layouts/PageTabsLayout'
import PageSection from '@ui-core/layouts/PageSection'

type GalleryItem = GalleryImg & {src_thumb: string, src_hd: string}

let defaultThumbnail: string | null = null

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

	const images: GalleryItem[] = useMemo(() => {
		document.querySelector('.gallery-container')?.scrollTo(0, 0)

		let imagesTmp: GalleryImg[] = GALLERY_IMAGES[selectedTab]
		if (imagesTmp == undefined) {
			console.error(`unknown character ${selectedTab}`)
			return []
		}
		
		const galleryItems = imagesTmp.map((image: GalleryImg) => {
			const name = `event/${image.img}`
			const [thumb, hd] = settings.eventImages.includes(name) || settings.unlockEverything
									? [imageSrc(name, 'thumb'), imageSrc(name, 'hd')]
									: [defaultThumbnail, defaultThumbnail]

			return {...image, src_thumb: thumb, src_hd: hd} as GalleryItem
		})

		return galleryItems
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
				<PageSection>
					<Fancybox
						options={{
							Toolbar: false,
							Thumbs: false,
							closeButton: false,
						}}>
						<div className='gallery-transition'>
						<AnimatePresence mode="popLayout">
							<motion.div
								key={selectedTab}
								variants={container}
								initial="hidden"
								animate="show"
								exit="hidden"
								className="gallery-container">
								{images?.map((image) =>
									<Fragment key={image.img}>
										{image.src_thumb === defaultThumbnail ?
											<div className="placeholder" />
										:
											<GalleryImage image={image} />
										}
									</Fragment>
								)}
							</motion.div>
						</AnimatePresence></div>
					</Fancybox>
				</PageSection>
			</PageTabsLayout>
		</motion.div>
	)
}

export default GalleryScreen


type GalleryImageProps = {
	image: GalleryItem
}
const GalleryImage = ({image}: GalleryImageProps) => {
	const {src_thumb, src_hd} = image

	const shouldBlur = image.sensitive && settings.blurThumbnails
	
	return (
		<a
			href={src_hd}
			data-fancybox="gallery"
			className={shouldBlur ? 'blur' : ''}>
			<img
				src={src_thumb}
				alt={`event ${image.img}`}
				draggable={false}
				fetchPriority={shouldBlur ? 'low' : 'auto'}
			/>
		</a>
	)
}