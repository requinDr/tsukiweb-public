import { Fragment, useMemo } from 'react'
import '../styles/gallery.scss'
import { settings } from '../utils/settings'
import * as motion from "motion/react-m"
import { AnimatePresence, Variants } from 'motion/react'
import { findImagesByRoute, GalleryImg, getImageVariants, imagePath, isImgUnlocked, UNLOCK_TOGETHER } from '../utils/gallery'
import { strings } from "../translation/lang"
import { imageSrc } from '../translation/assets'
import { SCREEN } from '../utils/display'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate'
import { Tab } from '@tsukiweb-common/ui-core/components/TabsComponent'
import PageTabsLayout from '@tsukiweb-common/ui-core/layouts/PageTabsLayout'
import useQueryParam from '@tsukiweb-common/hooks/useQueryParam'
import { CharId } from 'types'
import GalleryImage from 'components/gallery/GalleryImage'
import GalleryNbVariants from 'components/gallery/GalleryNbVariants'

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
	isImgUnlocked(image.img) || settings.unlockEverything

const GalleryScreen = () => {
	useScreenAutoNavigate(SCREEN.GALLERY)
	useLanguageRefresh()
	const [selectedTab, setSelectedTab] = useQueryParam<CharId>("tab", "ark")
	const tabImages: GalleryImg[] = useMemo(() => {
		let imagesTmp: GalleryImg[] = findImagesByRoute(selectedTab)
		if (imagesTmp == undefined) {
			console.error(`unknown character ${selectedTab}`)
			return []
		}
		
		const galleryItems = imagesTmp.filter(image => !image.alternativeOf)

		return galleryItems
	}, [selectedTab, settings.eventImages, settings.unlockEverything])

	const getImgDetails = (image: GalleryImg) => {
		const isUnlockedImage = isUnlocked(image)
		const variants = getImageVariants(image.img)
		const unlockedVariants = variants.filter(image => isUnlocked(image))

		if (isUnlockedImage && UNLOCK_TOGETHER[image.img]) {
			UNLOCK_TOGETHER[image.img].forEach((img) => {
				if (unlockedVariants.findIndex(v => v.img === img) === -1) {
					unlockedVariants.push(getImageVariants(img)[0])
				}
			})
		}

		return {
			isUnlockedImage,
			variants,
			unlockedVariants,
		}
	}

	const tabs: Tab[] = ['ark','cel','aki','his','koha'].map(char => ({
		label: strings.characters[char as CharId],
		value: char
	}))

	return (
		<PageTabsLayout
			id="gallery"
			tabs={tabs}
			selectedTab={selectedTab}
			setSelectedTab={setSelectedTab}
		>
			<section>
				<AnimatePresence mode="popLayout">
					<motion.div
						key={selectedTab}
						variants={container}
						initial="hidden"
						animate="show"
						exit="hidden"
						className="gallery-container">
						{tabImages?.map((image) => {
							const {isUnlockedImage, variants, unlockedVariants} = getImgDetails(image)
							const mainImage = isUnlockedImage ? image : unlockedVariants[0]
							const thumbSrc = imageSrc(imagePath(mainImage?.img), 'thumb')
							const showGalleryImage = isUnlockedImage || unlockedVariants.length > 0
							
							return (
								<Fragment key={image.img}>
									{showGalleryImage ?
										<GalleryImage
											image={mainImage}
											thumb={thumbSrc}
											variants={variants}
											unlockedVariants={unlockedVariants}
											blurred={image.sensitive && settings.blurThumbnails}
											imagePath={imagePath}
										/>
									:
										<div className="placeholder">
											{variants.length > 1 && (
												<GalleryNbVariants
													nbVariants={variants.length}
													nbUnlocked={unlockedVariants.length}
												/>
											)}
										</div>
									}
								</Fragment>
							)
						})}
					</motion.div>
				</AnimatePresence>
			</section>
		</PageTabsLayout>
	)
}

export default GalleryScreen