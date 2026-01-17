import "@styles/crash.scss"
import { getErrorMessage } from "react-error-boundary"
import { APP_VERSION } from "utils/constants"


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
				<h1>An error has occured <span style={{ whiteSpace: 'nowrap' }}>:(</span></h1>
				<p>
					If this is the first time you've launched this application on this browser,
					you may need to update it or try using another one.
				</p>
				<details className="code">
					<summary>
						{error?.message} <i className="ver">—v{APP_VERSION}</i>
					</summary>
					<p>
						{error?.stack}
					</p>
				</details>
				<a href={import.meta.env.BASE_URL}>
					Go back to the home page
				</a>
			</div>
		</div>
	)
}

export default PageCrash