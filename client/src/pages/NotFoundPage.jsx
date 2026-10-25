import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="container page-section">
      <div className="status">
        <h1 className="status-title">Page not found</h1>
        <p>The page you&rsquo;re looking for doesn&rsquo;t exist.</p>
        <Link to="/" className="btn-gold">Back to home</Link>
      </div>
    </section>
  )
}

export default NotFoundPage
