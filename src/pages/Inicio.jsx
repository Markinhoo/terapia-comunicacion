function Inicio() {
  return (
    <main className="container">
      <section className="hero">
        <h1>Terapia de Comunicación Humana</h1>
        <p>
          Atención especializada para niñas, niños, adolescentes y adultos
          en lenguaje, habla, voz, audición, aprendizaje y comunicación.
        </p>
        <a href="/agendar" className="btn">Agendar valoración inicial</a>
      </section>

      <section className="cards">
        <div>
          <h3>Terapia de lenguaje</h3>
          <p>Apoyo en dificultades del habla, lenguaje y articulación.</p>
        </div>

        <div>
          <h3>Estimulación temprana</h3>
          <p>Desarrollo de habilidades comunicativas en edades iniciales.</p>
        </div>

        <div>
          <h3>Lectoescritura</h3>
          <p>Atención a dificultades de lectura, escritura y aprendizaje.</p>
        </div>

        <div>
          <h3>Orientación a padres</h3>
          <p>Acompañamiento familiar para reforzar avances en casa.</p>
        </div>

        <div>
          <h3>Terapia para adultos</h3>
          <p>Atención en voz, habla, lenguaje y comunicación funcional.</p>
        </div>

        <div>
          <h3>Evaluación inicial</h3>
          <p>Valoración profesional para definir un plan de intervención.</p>
        </div>
      </section>
    </main>
  );
}

export default Inicio;
