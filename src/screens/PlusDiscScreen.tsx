import '@styles/plus-disc.scss'
import { SCREEN } from '../utils/display'
import Cover from "../assets/images/plus-disc_cover.webp"
import { MessageContainer, TabsComponent } from '@tsukiweb-common/ui-core'
import useQueryParam from '@tsukiweb-common/hooks/useQueryParam'
import * as motion from "motion/react-m"
import { AnimatePresence, Variants } from 'motion/react'
import ScenesTab from 'components/plus-disc/ScenesTab'
import GalleryTab from 'components/plus-disc/GalleryTab'
import { useLanguageRefresh, useScreenAutoNavigate } from 'hooks'

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
						alt="Plus-Disc Cover"
						className="cover"
					/>
					<div className='desc'>
						<a href="https://vndb.org/v49" target="_blank">
							VNDB
						</a>
						<p>
							PLUS-DISC is a fan disc containing a short story and bonus, originally released in 2001.<br />
							Note: You should read Tsukihime first.
						</p>
					</div>
				</div>
				<MessageContainer style={{marginTop: '1rem'}}>
					Work in progress
				</MessageContainer>
				<TabsComponent
					tabs={[
						{
							label: "Scenes",
							value: "scenes"
						},
						{
							label: "Gallery",
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