// One component for the loading, error and empty states
function StatusMessage({ kind, title, children, onRetry }) {
  if (kind === 'loading') {
    return (
      <div className="status" role="status">
        <div className="spinner" aria-hidden="true" />
        <p>{title || 'Loading...'}</p>
      </div>
    )
  }

  const isError = kind === 'error'
  return (
    <div className={`status${isError ? ' status-error' : ''}`} role={isError ? 'alert' : 'status'}>
      <h2 className="status-title">{title}</h2>
      {children && <p>{children}</p>}
      {onRetry && (
        <button type="button" className="btn-gold" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export default StatusMessage
