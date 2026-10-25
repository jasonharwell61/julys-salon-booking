import { useEffect, useState } from 'react'
import { api } from './api/apiClient.js'
import { listServices } from './api/servicesApi.js'

function App() {
  const [health, setHealth] = useState('loading...')
  const [services, setServices] = useState(null)
  const [error, setError] = useState('')
  const [probe, setProbe] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const h = await api.get('/health', { auth: false, signal: controller.signal })
        const s = await listServices({ signal: controller.signal })
        setHealth(JSON.stringify(h))
        setServices(s)
      } catch (err) {
        if (err.name === 'AbortError') return
        setError(`${err.name}: ${err.message}${err.status ? ` (HTTP ${err.status})` : ''}`)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  async function runProbe(path) {
    try {
      await api.get(path)
      setProbe(`${path} succeeded`)
    } catch (err) {
      setProbe(`${path} -> ${err.name}: ${err.message} (HTTP ${err.status})`)
    }
  }

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>API layer smoke test</h1>
      <p><strong>Health:</strong> {health}</p>
      {error && <p style={{ color: 'crimson' }}><strong>Error:</strong> {error}</p>}
      <p><strong>Services loaded:</strong> {services ? services.length : '...'}</p>
      <ul>
        {services && services.map((s) => <li key={s.id}>{s.name}</li>)}
      </ul>
      <button onClick={() => runProbe('/does-not-exist')}>Test a 404</button>{' '}
      <button onClick={() => runProbe('/auth/me')}>Test a 401</button>
      <p>{probe}</p>
    </main>
  )
}

export default App