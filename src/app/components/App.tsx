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
			<LocaleSetter />
			
			<CommonProvider config={{
				imageSrc: imageSrc,
				cg: {
					shouldBlur: cg.shouldBlur
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
