import { Route, Routes } from 'react-router-dom'
import Footer from './components/Footer.jsx'
import Navigation from './components/Navigation.jsx'
import Home from './pages/Home.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ServiceDetailPage from './pages/ServiceDetailPage.jsx'
import ServicesPage from './pages/ServicesPage.jsx'

function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <Navigation />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
