import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useClinica, urlMarca } from '../contexts/clinica';
import { urlMapaInsertable, urlMapaPorDireccion } from '../utils/clinicBranding';
import {
  FaBookOpen,
  FaChildReaching,
  FaClipboardCheck,
  FaComments,
  FaLocationDot,
  FaMicrophoneLines
} from 'react-icons/fa6';

const iconosServicio = [FaComments, FaChildReaching, FaBookOpen, FaMicrophoneLines, FaClipboardCheck];

function Inicio() {
  const clinica = useClinica();
  const mapaVisible = urlMapaInsertable(clinica.mapa_embed_url)
    || urlMapaInsertable(clinica.mapa_url)
    || urlMapaPorDireccion(clinica.direccion);
  const [servicios, setServicios] = useState([]);
  const banners = (clinica.banner_rutas || []).map((ruta, index) => ({
    src: urlMarca(ruta), alt: `Imagen de ${clinica.nombre} ${index + 1}`,
    titulo: clinica.subtitulo || 'Comunicar abre nuevas posibilidades'
  }));
  if (banners.length === 0) banners.push({ src: null, alt: '', titulo: clinica.subtitulo || 'Comunicar abre nuevas posibilidades' });
  const [slideActual, setSlideActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const gestoCarrusel = useRef({ inicioX: 0, inicioY: 0 });

  useEffect(() => {
    supabase.from('servicios_clinica').select('id, nombre, descripcion')
      .eq('clinica_id', clinica.id).eq('activo', true).order('orden')
      .then(({ data }) => setServicios((data || []).map((item, index) => ({
        titulo: item.nombre,
        descripcion: item.descripcion || 'Atención personalizada para tus necesidades.',
        Icono: iconosServicio[index % iconosServicio.length]
      }))));
  }, [clinica.id]);

  useEffect(() => {
    if (pausado) return undefined;

    const intervalo = window.setInterval(() => {
      setSlideActual((actual) => (actual + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(intervalo);
  }, [pausado, banners.length]);

  const cambiarSlide = (direccion) => {
    setSlideActual(
      (actual) => (actual + direccion + banners.length) % banners.length
    );
  };

  const iniciarDeslizamiento = (event) => {
    const touch = event.touches[0];
    if (!touch) return;

    gestoCarrusel.current = {
      inicioX: touch.clientX,
      inicioY: touch.clientY
    };
    setPausado(true);
  };

  const terminarDeslizamiento = (event) => {
    const touch = event.changedTouches[0];
    if (!touch) return;

    const desplazamientoX = touch.clientX - gestoCarrusel.current.inicioX;
    const desplazamientoY = touch.clientY - gestoCarrusel.current.inicioY;

    if (
      Math.abs(desplazamientoX) >= 45
      && Math.abs(desplazamientoX) > Math.abs(desplazamientoY)
    ) {
      cambiarSlide(desplazamientoX < 0 ? 1 : -1);
    }

    setPausado(false);
  };

  return (
    <main className="inicio-page">
      <section
        className="hero-carousel"
        aria-roledescription="carrusel"
        aria-label="Servicios de terapia de comunicación"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onFocus={() => setPausado(true)}
        onBlur={() => setPausado(false)}
        onTouchStart={iniciarDeslizamiento}
        onTouchEnd={terminarDeslizamiento}
        onTouchCancel={() => setPausado(false)}
      >
        <div className="carousel-viewport">
          {banners.map((banner, index) => (
            <article
              className={`carousel-slide ${index === slideActual ? 'active' : ''}`}
              key={banner.src}
              aria-hidden={index !== slideActual}
            >
              {banner.src && <img src={banner.src} alt={banner.alt} />}
              <div className="carousel-overlay" />
              <div className="hero-text">
                <span className="hero-kicker">{clinica.nombre}</span>
                <h1>{banner.titulo}</h1>
                <p>
                  Evaluación, diagnóstico e intervención especializada en
                  lenguaje, habla, voz, audición y comunicación.
                </p>
                <Link to="/agendar" className="btn hero-cta">
                  Agendar valoración
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
          Conoce cada área colocando el cursor o seleccionando una tarjeta.
        </p>

        <div className="servicios-carousel-mobile" aria-label="Carrusel de servicios">
          <div className="servicios-home-grid">
            {servicios.map(({ titulo, descripcion, Icono }) => (
              <article
                className="servicio-home-card"
                key={titulo}
                tabIndex="0"
              >
                <div className="servicio-icon" aria-hidden="true">
                  <Icono />
                </div>
                <h3>{titulo}</h3>
                <p>{descripcion}</p>
                <span className="servicio-hint">Ver informacion</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {(clinica.direccion || clinica.mapa_url || mapaVisible) && <section className="ubicacion-home" aria-labelledby="ubicacion-titulo">
        <div className={`ubicacion-card${mapaVisible ? '' : ' sin-mapa'}`}>
          {mapaVisible && <div className="ubicacion-map">
            <iframe
              title={`Mapa de ${clinica.nombre}`}
              src={mapaVisible}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>}
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
                <strong>{clinica.nombre}</strong>
                <address>{clinica.direccion}</address>
              </div>
            </div>

            {clinica.mapa_url && <a
              className="btn ubicacion-button"
              href={clinica.mapa_url}
              target="_blank"
              rel="noreferrer"
            >
              <FaLocationDot aria-hidden="true" />
              Abrir ubicación en Google Maps
            </a>}
          </div>
        </div>
      </section>}
    </main>
  );
}

export default Inicio;
