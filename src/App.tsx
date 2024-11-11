import { BrowserRouter } from "react-router-dom";
import AnimatedRoutes from './AnimatedRoutes';
import { getLocale } from "./translation/lang";
import { ErrorBoundary } from "react-error-boundary";
import PageCrash from "./screens/CrashScreen";
import { useLanguageRefresh } from "./components/hooks/useLanguageRefresh";

const LocaleSetter = () => {
	useLanguageRefresh()
	document.documentElement.setAttribute('lang', getLocale())

	return null
}

function App() {
	return (
		<ErrorBoundary FallbackComponent={PageCrash}>
			<LocaleSetter />
			
			<BrowserRouter
				basename={import.meta.env.BASE_URL}
				future={{
					v7_startTransition: true,
					v7_relativeSplatPath: true,
				}}
			>
				<AnimatedRoutes />
			</BrowserRouter>
		</ErrorBoundary>
	)
}

export default App
