import { Link } from 'react-router-dom';

function Inicio() {
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <h1>Terapia de Comunicación Humana</h1>
          <p>
            Atención especializada para niñas, niños, adolescentes y adultos
            en lenguaje, habla, voz, aprendizaje y comunicación.
          </p>

          <div className="hero-buttons">
            <Link to="/agendar" className="btn">
              Agendar valoración inicial
            </Link>
          </div>
        </div>
      </section>

      <section className="container">
        <h2 className="section-title">Servicios</h2>

        <div className="cards">
          <div className="card">
            <h3>Terapia de lenguaje infantil</h3>
            <p>Apoyo en dificultades de lenguaje, habla y articulación.</p>
          </div>

          <div className="card">
            <h3>Estimulación temprana</h3>
            <p>Desarrollo de habilidades comunicativas en edades iniciales.</p>
          </div>

          <div className="card">
            <h3>Lectoescritura</h3>
            <p>Atención a dificultades en lectura, escritura y aprendizaje.</p>
          </div>

          <div className="card">
            <h3>Problemas de articulación</h3>
            <p>Intervención en pronunciación y claridad del habla.</p>
          </div>

          <div className="card">
            <h3>Terapia para adultos</h3>
            <p>Atención en voz, lenguaje y comunicación funcional.</p>
          </div>

          <div className="card">
            <h3>Orientación a padres</h3>
            <p>Acompañamiento familiar para reforzar avances en casa.</p>
          </div>
        </div>
      </section>

      <section className="container info-section">
        <h2>Lic. Sandra Estefanía Vargas Casas</h2>
        <p>
          Licenciada en Terapia de la Comunicación Humana, con atención
          profesional y personalizada para favorecer el desarrollo comunicativo,
          social y académico de cada paciente.
        </p>
      </section>
    </main>
  );
}

export default Inicio;