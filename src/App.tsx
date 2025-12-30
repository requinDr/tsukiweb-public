import { BrowserRouter } from "react-router";
import AnimatedRoutes from './AnimatedRoutes';
import { getLocale } from "./translation/lang";
import { ErrorBoundary } from "react-error-boundary";
import PageCrash from "./screens/CrashScreen";
import AppLayout from "layouts/AppLayout";
import { Slide, ToastContainer } from "react-toastify";
import { CommonProvider } from "@tsukiweb-common/context";
import { imageSrc } from "translation/assets";
import cg from "utils/gallery";

const LocaleSetter = () => {
	document.documentElement.setAttribute('lang', getLocale())

	return null
}

function App() {
	return (
		<ErrorBoundary FallbackComponent={PageCrash}>
			<LocaleSetter />
			
			<CommonProvider config={{
				imageSrc: imageSrc,
				cg: {
					shouldBlur: cg.shouldBlur
				}
			}}>
				<BrowserRouter
					basename={import.meta.env.BASE_URL}
				>
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
				</BrowserRouter>
			</CommonProvider>
		</ErrorBoundary>
	)
}

export default App
