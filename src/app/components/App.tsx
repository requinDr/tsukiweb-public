import { Router } from "wouter";
import AnimatedRoutes from '../../app/components/AnimatedRoutes';
import { getLocale } from "../../translation/lang";
import { ErrorBoundary } from "react-error-boundary";
import AppLayout from "app/components/AppLayout";
import { Slide, ToastContainer } from "react-toastify";
import { CommonProvider } from "@tsukiweb-common/context";
import { imageSrc } from "translation/assets";
import { useObserved, useObserver } from "@tsukiweb-common/utils/Observer";
import { settings } from "engine/settings";
import cg from "features/gallery/utils/gallery";
import PageCrash from "app/screens/CrashScreen";

const LocaleSetter = () => {
	useObserver(() => {
		document.documentElement.setAttribute('lang', getLocale())
	}, settings, 'language')

	return null
}

function App() {
	useObserved(settings, 'eroBlur')
	return (
		<ErrorBoundary FallbackComponent={PageCrash}>
			<LocaleSetter />
			
			<CommonProvider config={{
				imageSrc: imageSrc,
				cg: {
					shouldBlur: cg.shouldBlur
				}
			}}>
				<Router base={import.meta.env.BASE_URL}>
					<AppLayout>
						<AnimatedRoutes />
					</AppLayout>

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
		</ErrorBoundary>
	)
}

export default App
