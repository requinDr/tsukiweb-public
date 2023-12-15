import "../styles/crash.scss"

type Props = {
  error: Error
}

/**
 * Display on crash
 * Used as a fallback component for ErrorBoundary
 * - Should use as little dependencies as possible
 */
const PageCrash = ({ error }: Props) => { 
  return (
    <div id="page-crash" className="page">
      <div className="page-content">
        <h1>:(</h1>
        <h2>An error happened</h2>
        <p>
          If this is the first time you launch this application on this browser,
          you may need to update it or use another one.
        </p>
        <details>
          <summary>More about the error</summary>
          <p>
            <b>{error.message}</b><br /><br />
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