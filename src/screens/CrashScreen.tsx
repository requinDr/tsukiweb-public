import "@styles/crash.scss"


/**
 * Display on crash
 * Used as a fallback component for ErrorBoundary
 * - Should use as few dependencies as possible
 */
type Props = {
	error: Error
}
const PageCrash = ({ error }: Props) => { 
	return (
		<div id="page-crash" className="page">
			<div className="page-content">
				<h1>An error has occured :(</h1>
				<p>
					If this is the first time you've launched this application on this browser,
					you may need to update it or try using another one.
				</p>
				<details className="code">
					<summary>{error.message}</summary>
					<p>
						{error.stack}
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