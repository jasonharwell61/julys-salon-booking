import { Link } from 'react-router-dom'
import heroEye from '../assets/hero-eye.jpg'

const STEPS = [
  {
    title: 'Choose a service',
    text: 'Browse full sets, fills, lash lifts and removal, with clear prices and times.',
  },
  {
    title: 'Pick your time',
    text: 'Select a day and time that works for you.',
  },
  {
    title: 'Relax and enjoy',
    text: 'Arrive, settle in, and leave with lashes you love.',
  },
]

function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-photo" aria-hidden="true">
          <img src={heroEye} alt="" />
        </div>
        <div className="container">
          <div className="hero-content">
            <p className="eyebrow">Lash artistry</p>
            <h1>Lashes, beautifully done</h1>
            <p className="lead">
              Book eyelash extensions, fills and lash lifts at July&rsquo;s Salon in just a few
              taps.
            </p>
            <Link to="/services" className="btn-gold">
              View services
            </Link>
          </div>
        </div>
      </section>

      <section className="container page-section">
        <h2>How it works</h2>
        <ol className="steps mt-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="step">
              <span className="step-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}

export default Home
