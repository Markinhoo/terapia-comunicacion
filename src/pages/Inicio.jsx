import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBookOpen,
  FaChildReaching,
  FaClipboardCheck,
  FaComments,
  FaLocationDot,
  FaMicrophoneLines
} from 'react-icons/fa6';

const banners = [
  {
    src: '/banner1.png',
    alt: 'Terapia de lenguaje',
    titulo: 'Comunicar abre nuevas posibilidades'
  },
  {
    src: '/banner2.png',
    alt: 'Terapia infantil',
    titulo: 'Acompanamiento cercano para cada etapa'
  },
  {
    src: '/banner3.png',
    alt: 'Comunicacion humana',
    titulo: 'Evaluacion e intervencion especializada'
  },
  {
    src: '/banner4.png',
    alt: 'Terapia de comunicacion',
    titulo: 'Estrategias pensadas para cada persona'
  }
];

const servicios = [
  {
    titulo: 'Terapia de lenguaje',
    descripcion:
      'Fortalece la comprension, la expresion y el uso funcional del lenguaje en la vida diaria.',
    Icono: FaComments
  },
  {
    titulo: 'Lenguaje infantil',
    descripcion:
      'Acompana el desarrollo del vocabulario, las frases, la comunicacion social y la comprension.',
    Icono: FaChildReaching
  },
  {
    titulo: 'Lectoescritura',
    descripcion:
      'Apoya habilidades como conciencia fonologica, lectura, escritura y comprension de textos.',
    Icono: FaBookOpen
  },
  {
    titulo: 'Terapia de voz',
    descripcion:
      'Promueve un uso saludable y eficiente de la voz mediante respiracion, higiene y tecnica vocal.',
    Icono: FaMicrophoneLines
  },
  {
    titulo: 'Evaluacion inicial',
    descripcion:
      'Identifica fortalezas y necesidades para establecer objetivos y un plan terapeutico personalizado.',
    Icono: FaClipboardCheck
  }
];

const corrientes = [
  'A B C 1 2 3 LENGUAJE 4 5 D E F VOZ 6 7 G H I 8 9 COMUNICACION 0',
  'PALABRAS 2 4 6 SONIDOS 8 0 A E I O U 1 3 5 ESCUCHAR 7 9',
  'M N Ñ O 3 1 HABLAR 4 1 P Q R 5 9 LEER 2 6 S T U 5 3',
  '7 2 APRENDER V W X 8 4 EXPRESAR Y Z 9 6 COMPRENDER 1 0'
];

function Inicio() {
  const [slideActual, setSlideActual] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado) return undefined;

    const intervalo = window.setInterval(() => {
      setSlideActual((actual) => (actual + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(intervalo);
  }, [pausado]);

  const cambiarSlide = (direccion) => {
    setSlideActual(
      (actual) => (actual + direccion + banners.length) % banners.length
    );
  };

  return (
    <main className="inicio-page">
      <div className="symbol-river" aria-hidden="true">
        <div className="symbol-river-perspective">
          {corrientes.map((texto, index) => (
            <div
              className={`symbol-stream symbol-stream-${index + 1}`}
              key={texto}
            >
              <div className="symbol-stream-track">
                <span>{texto}</span>
                <span>{texto}</span>
                <span>{texto}</span>
                <span>{texto}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="symbol-river-fade" />
      </div>

      <section
        className="hero-carousel"
        aria-roledescription="carrusel"
        aria-label="Servicios de terapia de comunicacion"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onFocus={() => setPausado(true)}
        onBlur={() => setPausado(false)}
      >
        <div className="carousel-viewport">
          {banners.map((banner, index) => (
            <article
              className={`carousel-slide ${index === slideActual ? 'active' : ''}`}
              key={banner.src}
              aria-hidden={index !== slideActual}
            >
              <img src={banner.src} alt={banner.alt} />
              <div className="carousel-overlay" />
              <div className="hero-text">
                <span className="hero-kicker">Clinica Casas</span>
                <h1>{banner.titulo}</h1>
                <p>
                  Evaluacion, diagnostico e intervencion especializada en
                  lenguaje, habla, voz, audicion y comunicacion.
                </p>
                <Link to="/agendar" className="btn hero-cta">
                  Agendar valoracion
                </Link>
              </div>
            </article>
          ))}

          <button
            type="button"
            className="carousel-arrow carousel-arrow-prev"
            onClick={() => cambiarSlide(-1)}
            aria-label="Imagen anterior"
          >
            &#8249;
          </button>

          <button
            type="button"
            className="carousel-arrow carousel-arrow-next"
            onClick={() => cambiarSlide(1)}
            aria-label="Imagen siguiente"
          >
            &#8250;
          </button>

          <div className="carousel-dots" aria-label="Seleccionar imagen">
            {banners.map((banner, index) => (
              <button
                type="button"
                key={banner.src}
                className={index === slideActual ? 'active' : ''}
                onClick={() => setSlideActual(index)}
                aria-label={`Mostrar imagen ${index + 1}`}
                aria-current={index === slideActual ? 'true' : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="servicios-home" aria-labelledby="servicios-titulo">
        <span className="section-kicker">Atencion especializada</span>
        <h2 id="servicios-titulo">Nuestros servicios</h2>
        <p className="servicios-intro">
          Conoce cada area colocando el cursor o seleccionando una tarjeta.
        </p>

        <div className="servicios-home-grid">
          {servicios.map(({ titulo, descripcion, Icono }) => (
            <article className="servicio-home-card" key={titulo} tabIndex="0">
              <div className="servicio-icon" aria-hidden="true">
                <Icono />
              </div>
              <h3>{titulo}</h3>
              <p>{descripcion}</p>
              <span className="servicio-hint">Ver informacion</span>
            </article>
          ))}
        </div>
      </section>

      <section className="ubicacion-home" aria-labelledby="ubicacion-titulo">
        <div className="ubicacion-card">
          <div className="ubicacion-map">
            <iframe
              title="Ubicación de Clínica Casas"
              src="https://www.google.com/maps?q=24.002899,-104.6377189&z=17&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div className="ubicacion-info">
            <span className="section-kicker">Visítanos</span>
            <h2 id="ubicacion-titulo">Ubicación de la clínica</h2>
            <p>
              Encuentra nuestras instalaciones y abre la ruta desde tu
              ubicación para llegar fácilmente.
            </p>

            <div className="ubicacion-address">
              <span className="ubicacion-icon" aria-hidden="true">
                <FaLocationDot />
              </span>
              <div>
                <strong>Clínica Casas</strong>
                <address>
                  459 C. Armonía<br />
                  Victoria de Durango, Durango
                </address>
              </div>
            </div>

            <a
              className="btn ubicacion-button"
              href="https://maps.app.goo.gl/aDPZSECwxDrSt5sf7"
              target="_blank"
              rel="noreferrer"
            >
              <FaLocationDot aria-hidden="true" />
              Abrir ubicación en Google Maps
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Inicio;
