import { ComponentProps, useMemo } from 'react'
import '@styles/gallery.scss'
import { settings } from '../utils/settings'
import * as m from "motion/react-m"
import { AnimatePresence, Variants } from 'motion/react'
import cg from '../utils/gallery'
import { strings } from "../translation/lang"
import { SCREEN } from '../utils/display'
import { PageTabsLayout } from '@tsukiweb-common/ui-core'
import useQueryParam from '@tsukiweb-common/hooks/useQueryParam'
import { CharId } from 'types'
import GalleryImage from 'components/gallery/GalleryImage'
import GalleryTotal from 'components/gallery/GalleryTotal'
import { useScreenAutoNavigate, useLanguageRefresh } from 'hooks'

const container: Variants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.5
		}
	}
}

const isShown = (image: string) =>
	cg.isUnlocked(image) || settings.unlockEverything

const getImgDetails = (image: string) => {
	let alts: string[] = [image, ...cg.getAlts(image)]
	let shownAlts: string[] = alts.filter(isShown)
	
	// if a shown alt has some unlockIds, show them too
	shownAlts.forEach(alt => {
		const unlockIds = cg.getImg(alt).unlockIds || []
		unlockIds.forEach(unlockId => {
			if (!shownAlts.includes(unlockId))
				shownAlts = [...shownAlts, unlockId]
		})
	})

	return { alts, shownAlts }
}

const GalleryScreen = () => {
	useScreenAutoNavigate(SCREEN.GALLERY)
	useLanguageRefresh()
	const [selectedTab, setSelectedTab] = useQueryParam<CharId>("tab", "ark")

	const tabImages: string[] = useMemo(() => {
		const imagesTmp = cg.getByGroup(selectedTab)
		if (imagesTmp == undefined) {
			console.error(`unknown character ${selectedTab}`)
			return []
		}
		
		return imagesTmp.filter(image => !cg.getImg(image).altOf)
	}, [selectedTab])

	const tabs: ComponentProps<typeof PageTabsLayout>["tabs"] = ['ark','cel','aki','his','koha'].map(char => ({
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
					<m.div
						key={selectedTab}
						variants={container}
						initial="hidden"
						animate="show"
						exit="hidden"
						className="gallery-container">
						{tabImages?.map(image => {
							const {alts, shownAlts} = getImgDetails(image)

							if (shownAlts.length > 0) {
								const mainImage = shownAlts[0]

								return (
									<GalleryImage
										key={image}
										image={mainImage}
										gallery={alts}
										galleryUnlocked={shownAlts}
										blurred={cg.shouldBlur(mainImage)}
										showTotal={true}
										getGalleryImg={cg.getImg}
									/>
								)
							}

							return (
								<div key={image} className="placeholder">
									{alts.length > 1 &&
										<GalleryTotal
											nbTotal={alts.length}
											nbUnlocked={shownAlts.length}
										/>
									}
								</div>
							)
						})}
					</m.div>
				</AnimatePresence>
			</section>
		</PageTabsLayout>
	)
}

export default GalleryScreen