import { useMemo } from 'react'
import '../styles/gallery.scss'
import { settings } from '../utils/settings'
import * as motion from "motion/react-m"
import { AnimatePresence, Variants } from 'motion/react'
import cg from '../utils/gallery'
import { strings } from "../translation/lang"
import { imageSrc } from '../translation/assets'
import { SCREEN } from '../utils/display'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate'
import { Tab } from '@tsukiweb-common/ui-core/components/TabsComponent'
import PageTabsLayout from '@tsukiweb-common/ui-core/layouts/PageTabsLayout'
import useQueryParam from '@tsukiweb-common/hooks/useQueryParam'
import { CharId, GalleryImg } from 'types'
import GalleryImage from 'components/gallery/GalleryImage'
import GalleryTotal from 'components/gallery/GalleryTotal'

const container: Variants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.5
		}
	}
}

const isShown = (image: GalleryImg) =>
	cg.isUnlocked(image.name) || settings.unlockEverything

const GalleryScreen = () => {
	useScreenAutoNavigate(SCREEN.GALLERY)
	useLanguageRefresh()
	const [selectedTab, setSelectedTab] = useQueryParam<CharId>("tab", "ark")

	const tabImages: GalleryImg[] = useMemo(() => {
		const imagesTmp = cg.getByGroup(selectedTab)
		if (imagesTmp == undefined) {
			console.error(`unknown character ${selectedTab}`)
			return []
		}
		
		return imagesTmp.filter(image => !image.altOf)
	}, [selectedTab])

	const getImgDetails = (image: GalleryImg) => {
		const isShownImage = isShown(image)
		const alts = cg.getAlts(image.name)
		const shownAlts = alts.filter(a => isShown(a))

		if (isShownImage && image.unlockIds) {
			image.unlockIds.forEach(imgName => {
				if (shownAlts.findIndex(v => v.name === imgName) === -1) {
					shownAlts.push(cg.getAlts(imgName)[0])
				}
			})
		}

		return {
			isShownImage,
			alts,
			shownAlts,
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
						{tabImages?.map(image => {
							const {isShownImage, alts, shownAlts} = getImgDetails(image)
							const showGalleryImage = isShownImage || shownAlts.length > 0

							if (showGalleryImage) {
								const mainImage = isShownImage ? image : shownAlts[0]
								const thumbSrc = imageSrc(cg.getPath(mainImage?.name), 'thumb')

								return (
									<GalleryImage
										key={image.name}
										image={mainImage}
										src={thumbSrc}
										gallery={alts}
										galleryUnlocked={shownAlts}
										blurred={cg.shouldBlur(mainImage.name)}
										showTotal={true}
										imagePath={cg.getPath}
									/>
								)
							}

							return (
								<div key={image.name} className="placeholder">
									{alts.length > 1 &&
										<GalleryTotal
											nbTotal={alts.length}
											nbUnlocked={shownAlts.length}
										/>
									}
								</div>
							)
						})}
					</motion.div>
				</AnimatePresence>
			</section>
		</PageTabsLayout>
	)
}

export default GalleryScreen