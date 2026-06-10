import { Link } from 'react-router-dom';

function Inicio() {
  return (
    <main className="inicio-page">
      <section className="hero-slider">
        <div className="slider-track">
          <img src="/banner1.png" alt="Terapia de lenguaje" />
          <img src="/banner2.png" alt="Terapia infantil" />
          <img src="/banner3.png" alt="Comunicación humana" />
          <img src="/banner4.png" alt="Terapia de comunicación" />
        </div>

        <div className="hero-text">
          <h1>Terapia de la Comunicación Humana</h1>
          <p>
            Evaluación, diagnóstico e intervención especializada en lenguaje,
            habla, voz, audición y comunicación.
          </p>

          <Link to="/agendar" className="btn">
            Agendar valoración
          </Link>
        </div>
      </section>

      <section className="servicios-home">
        <h2>Servicios</h2>

        <div className="servicios-home-grid">
          <div className="servicio-home-card">
            <span>🗣️</span>
            <h3>Terapia de lenguaje</h3>
          </div>

          <div className="servicio-home-card">
            <span>👧</span>
            <h3>Lenguaje infantil</h3>
          </div>

          <div className="servicio-home-card">
            <span>📚</span>
            <h3>Lectoescritura</h3>
          </div>

          <div className="servicio-home-card">
            <span>🎙️</span>
            <h3>Terapia de voz</h3>
          </div>

          <div className="servicio-home-card">
            <span>📋</span>
            <h3>Evaluación inicial</h3>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Inicio;