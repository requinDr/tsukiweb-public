import { Router } from "wouter";
import AnimatedRoutes from '../../app/components/AnimatedRoutes';
import { getLocale } from "../../translation/lang";
import AppEffects from "app/components/AppEffects";
import { Slide, ToastContainer } from "react-toastify";
import { CommonProvider } from "@tsukiweb/common/context";
import { imageSrc } from "translation/assets";
import { useObserved, useObserver } from "@tsukiweb/common/utils/Observer";
import { settings } from "engine/settings";
import cg from "features/gallery/utils/gallery";
import { BADGES_DEFINES } from "features/flowchart/components/badges";

const LocaleSetter = () => {
	useObserver(() => {
		document.documentElement.setAttribute('lang', getLocale())
	}, settings, 'language')

	return null
}

function App() {
	useObserved(settings, 'eroBlur')
	return (
		<>
			<svg viewBox="0 0 0 0" style={{position:"absolute", height:0, width:0}}>{BADGES_DEFINES}</svg>
			<LocaleSetter />
			
			<CommonProvider config={{
				imageSrc: imageSrc,
				cg: {
					shouldBlur: cg.shouldBlur,
					shouldFrame: cg.isInGallery,
				}
			}}>
				<Router base={import.meta.env.BASE_URL}>
					<AppEffects>
						<AnimatedRoutes />
					</AppEffects>

					<ToastContainer
						transition={Slide}
						position="bottom-right"
						autoClose={3000}
						closeButton={false}
						pauseOnFocusLoss={false}
						draggable
						theme="dark" />
				</Router>
			</CommonProvider>
		</>
	)
}

export default App
