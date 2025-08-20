import '@styles/plus-disc.scss'
import { SCREEN } from '../utils/display'
import Cover from "../assets/images/plus-disc_cover.webp"
import { TabsComponent } from '@tsukiweb-common/ui-core'
import useQueryParam from '@tsukiweb-common/hooks/useQueryParam'
import * as motion from "motion/react-m"
import { AnimatePresence, Variants } from 'motion/react'
import ScenesTab from 'components/plus-disc/ScenesTab'
import GalleryTab from 'components/plus-disc/GalleryTab'
import { useLanguageRefresh, useScreenAutoNavigate } from 'hooks'
import { strings } from 'translation/lang'

const container: Variants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.5
		}
	}
}

const PlusDiscScreen = () => {
	useScreenAutoNavigate(SCREEN.PLUS_DISC)
	useLanguageRefresh()
	const [selectedTab, setSelectedTab] = useQueryParam<"scenes" | "gallery">("tab", "scenes")

	return (
		<div className="page" id="plus-disc">
			<main>
				<div className="header">
					<img
						src={Cover}
						alt="Plus-Disc cover"
						className="cover"
					/>
					<div className='desc'>
						<a href="https://vndb.org/v49" target="_blank">
							VNDB
						</a>
						<p>
							{strings.plus_disc.desc.map((line, index) => (
								<span key={index}>
									{line}<br />
								</span>
							))}
						</p>
					</div>
				</div>
				<TabsComponent
					tabs={[
						{
							label: strings.plus_disc.scenes,
							value: "scenes"
						},
						{
							label: strings.plus_disc.gallery,
							value: "gallery"
						}
					]}
					selected={selectedTab}
					setSelected={setSelectedTab}
				/>

					<AnimatePresence mode="popLayout">
						<motion.div
							key={selectedTab}
							variants={container}
							initial="hidden"
							animate="show"
							exit="hidden"
						>
							{selectedTab === "scenes" ? (
								<ScenesTab />
							) : (
								<GalleryTab />
							)}
						</motion.div>
					</AnimatePresence>
			</main>
		</div>
	)
}

export default PlusDiscScreen