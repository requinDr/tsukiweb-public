import '@features/plus-disc/styles/plus-disc.scss'
import Cover from "@assets/images/plus-disc_cover.webp"
import { TabsBar } from '@tsukiweb-common/ui-core'
import * as m from "motion/react-m"
import { AnimatePresence, Variants } from 'motion/react'
import { strings } from 'translation/lang'
import { APP_INFO } from 'app/utils/constants'
import { useNavBackRef, useQueryParam } from '@tsukiweb-common/hooks'
import GalleryTab from 'features/plus-disc/components/GalleryTab';
import ScenesTab from 'features/plus-disc/components/ScenesTab';
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
function back() {
	(document.querySelector('#extra-plus-disc') as HTMLElement)?.focus()
}

const PlusDiscScreen = () => {
	useScreenAutoNavigate(SCREEN.PLUS_DISC)
	useLanguageRefresh()
	const [selectedTab, setSelectedTab] = useQueryParam<"scenes" | "gallery">("tab", "scenes")

	return (
		<main className="page" id="plus-disc" ref={useNavBackRef(back)}>
			<div className="header">
				<img
					src={Cover}
					alt="Plus-Disc cover"
					className="cover"
				/>
				<div className='desc'>
					<a href={APP_INFO.PLUS_DISC_VNDB} target="_blank">
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
			<TabsBar
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
				<m.div
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
				</m.div>
			</AnimatePresence>
		</main>
	)
}

export default PlusDiscScreen