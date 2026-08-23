import { APP_VERSION } from "app/utils/constants";
import "../styles/crash.scss"
import { getErrorMessage } from "react-error-boundary"


/**
 * Display on crash
 * Used as a fallback component for ErrorBoundary
 * - Should use as few dependencies as possible
 */
type Props = {
	error: unknown
}
const PageCrash = ({ error }: Props) => {
	if (!(error instanceof Error)) {
		return (
			<div id="page-crash" className="page">
				<div className="page-content">
					<h1>{getErrorMessage(error)}</h1>
					<a href={import.meta.env.BASE_URL}>
						Go back to the home page
					</a>
				</div>
			</div>
		)
	}

	return (
		<div id="page-crash" className="page">
			<div className="page-content">
				<h1>An error has occured</h1>
				<p className="desc">
					If this is the first time you've launched this application on this browser,
					you may need to update it or try using another one.
				</p>
				<div className="code">
					<div className="summary">
						{error?.message}<div className="ver">v{APP_VERSION}</div>
					</div>
					<p>
						{error?.stack}
					</p>
				</div>
				<a href={import.meta.env.BASE_URL}>
					Go back to the home page
				</a>
			</div>
		</div>
	)
}

export default PageCrash