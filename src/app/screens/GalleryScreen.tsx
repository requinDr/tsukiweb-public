import { ComponentProps, useMemo } from 'react'
import '@features/gallery/styles/gallery.scss'
import * as m from "motion/react-m"
import { AnimatePresence, Variants } from 'motion/react'
import { PageTabsLayout } from '@tsukiweb-common/ui-core'
import { CharId } from 'app/utils/types'
import GalleryImage from 'features/gallery/components/GalleryImage'
import { audio } from 'engine/audio'
import { GalleryTotal } from 'features/gallery/components/GalleryComponents'
import { useQueryParam } from '@tsukiweb-common/hooks'
import { CHARS } from 'app/utils/constants';
import { settings } from 'engine/settings';
import cg from 'features/gallery/utils/gallery';
import { strings } from 'translation/lang';
import { SCREEN } from 'app/utils/display';
import { useLanguageRefresh, useScreenAutoNavigate } from 'app/hooks';

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
		
		return imagesTmp.filter(image => !cg.getImg(image).altOf)
	}, [selectedTab])

	const tabs: ComponentProps<typeof PageTabsLayout>["tabs"] = CHARS.map(char => ({
		label: strings.characters[char as CharId],
		value: char,
		audio: audio
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
										nav-auto={1}
									/>
								)
							}

							return (
								<div key={image} className="placeholder" tabIndex={0} nav-auto={1}>
									{alts.length > 1 &&
										<GalleryTotal
											nbUnlocked={shownAlts.length}
											nbTotal={alts.length}
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