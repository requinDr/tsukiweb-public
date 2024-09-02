import '../styles/plus-disc.scss'
import { SCREEN } from '../utils/display'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate'
import GraphicsGroup from 'components/molecules/GraphicsGroup'
import { Graphics } from '@tsukiweb-common/types'
import { ReactNode } from 'react'
import Cover from "../assets/images/plus-disc_cover.webp"
import MessageContainer from '@tsukiweb-common/ui-core/components/MessageContainer'

const PlusDiscScreen = () => {
	useScreenAutoNavigate(SCREEN.PLUS_DISC)
	useLanguageRefresh()

	return (
		<div className="page" id="plus-disc">
			<main>
				<div className="header">
					<img
						src={Cover}
						alt="Plus Disc Cover"
						className="cover"
					/>
					<div className='desc'>
						<a href="https://vndb.org/v49" target="_blank">
							VNDB
						</a>
						<p>
							Plus Disc is a fan disc containing a short story and bonus.<br />
							It was originally released in 2001.
						</p>
					</div>
				</div>

				<MessageContainer style={{marginTop: '1rem'}}>
					Work in progress
				</MessageContainer>

				<div className="scenes-list">
					<Scene
						title="Alliance of Illusionary Eyes"
						images={{
							"bg": "bg/bg_59",
							"r": "tachi/akira_02"
						}}
					/>

					<Scene
						title="Geccha"
						images={{
							"bg": "bg/bg_59",
							"l": "tachi/ark_t01",
							"c": "tachi/aki_t04b",
							"r": "tachi/cel_t01a",
						}}
					/>

					<Scene
						title="Geccha 2"
						images={{
							"bg": "bg/s07",
							"l": "tachi/stk_t11",
							"r": "tachi/neko_t01a",
						}}
					/>

					<Scene
						title="Kinoko's Masterpiece Experimental Theater"
						images={{
							"bg": "bg/bg_40a",
							"c": "tachi/koha_t06",
						}}
					/>
				</div>
			</main>
		</div>
	)
}

export default PlusDiscScreen

type SceneProps = {
	title: ReactNode
	images: Graphics
	onClick?: ()=>void
}
const Scene = ({title, images, onClick}: SceneProps) => {
	return (
		<div className="scene" onClick={onClick}>
			<GraphicsGroup
				images={images}
				resolution="sd"
				className='scene-image'
			/>
			<div className="scene-title">
				{title}
			</div>
		</div>
	)
}