import { useEffect, useState } from 'react'

// Runs loader(signal) and tracks loading / error / data.
// - Pass a loader wrapped in useCallback so it only changes when its inputs change.
// - When the loader changes (or retry is called), the previous request is cancelled
//   and its result is ignored, so a slow old response can never overwrite a newer one.
export function useAsyncData(loader) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ loader: null, attempt: -1, data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()

    loader(controller.signal)
      .then((data) => setResult({ loader, attempt, data, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return // cancelled on purpose
        setResult({ loader, attempt, data: null, error })
      })

    return () => controller.abort()
  }, [loader, attempt])

  // A result only counts if it belongs to the CURRENT loader and attempt
  const loading = result.loader !== loader || result.attempt !== attempt

  return {
    loading,
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    retry: () => setAttempt((n) => n + 1),
  }
}
