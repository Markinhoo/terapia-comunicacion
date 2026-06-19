import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const MOBILE_BREAKPOINT = 1023;
const PARTICLE_COUNT = 10;
const GLOW_COLOR = '154, 125, 204';

function useDesktopDetection() {
  const [isDesktop, setIsDesktop] = useState(() => (
    window.innerWidth > MOBILE_BREAKPOINT
  ));

  useEffect(() => {
    const actualizar = () => setIsDesktop(window.innerWidth > MOBILE_BREAKPOINT);
    window.addEventListener('resize', actualizar);

    return () => window.removeEventListener('resize', actualizar);
  }, []);

  return isDesktop;
}

function crearParticula(element, color) {
  const particula = document.createElement('span');
  const rect = element.getBoundingClientRect();

  particula.className = 'gallery-bento-particle';
  particula.style.left = `${Math.random() * rect.width}px`;
  particula.style.top = `${Math.random() * rect.height}px`;
  particula.style.background = `rgba(${color}, 1)`;
  particula.style.boxShadow = `0 0 8px rgba(${color}, .72)`;
  element.appendChild(particula);

  gsap.fromTo(
    particula,
    { scale: 0, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: .3,
      ease: 'back.out(1.7)'
    }
  );

  gsap.to(particula, {
    x: (Math.random() - .5) * 90,
    y: (Math.random() - .5) * 90,
    rotation: Math.random() * 360,
    opacity: .2,
    duration: 1.7 + Math.random() * 1.4,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  return particula;
}

function GalleryBentoCard({ publication, getMediaUrl, animationsEnabled, onOpen }) {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const item = publication.medios[0];
  const mediaUrl = getMediaUrl(item.ruta_archivo);

  const limpiarParticulas = useCallback(() => {
    particlesRef.current.forEach((particula) => {
      gsap.killTweensOf(particula);
      gsap.to(particula, {
        scale: 0,
        opacity: 0,
        duration: .2,
        onComplete: () => particula.remove()
      });
    });
    particlesRef.current = [];
  }, []);

  useEffect(() => limpiarParticulas, [limpiarParticulas]);

  const manejarEntrada = () => {
    const element = cardRef.current;
    if (!animationsEnabled || !element || particlesRef.current.length > 0) return;

    particlesRef.current = Array.from(
      { length: PARTICLE_COUNT },
      () => crearParticula(element, GLOW_COLOR)
    );
  };

  const manejarMovimiento = (event) => {
    const element = cardRef.current;
    if (!animationsEnabled || !element) return;

    manejarEntrada();

    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / rect.height) * -8;
    const rotateY = ((x - rect.width / 2) / rect.width) * 8;

    element.style.setProperty('--gallery-glow-x', `${(x / rect.width) * 100}%`);
    element.style.setProperty('--gallery-glow-y', `${(y / rect.height) * 100}%`);
    element.style.setProperty('--gallery-glow-intensity', '1');

    gsap.to(element, {
      rotateX,
      rotateY,
      x: (x - rect.width / 2) * .025,
      y: (y - rect.height / 2) * .025,
      transformPerspective: 1100,
      duration: .16,
      ease: 'power2.out'
    });
  };

  const manejarSalida = () => {
    const element = cardRef.current;
    if (!animationsEnabled || !element) return;

    element.style.setProperty('--gallery-glow-intensity', '0');
    limpiarParticulas();
    gsap.to(element, {
      rotateX: 0,
      rotateY: 0,
      x: 0,
      y: 0,
      duration: .35,
      ease: 'power2.out'
    });
  };

  const manejarClick = (event) => {
    const element = cardRef.current;
    if (!element || event.target.closest('video')) return;

    if (animationsEnabled) {
      const rect = element.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'gallery-bento-ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: .8 },
        {
          scale: 1,
          opacity: 0,
          duration: .75,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      );
    }

    onOpen(publication);
  };

  return (
    <article
      ref={cardRef}
      className="galeria-card gallery-magic-card"
      onMouseEnter={manejarEntrada}
      onMouseMove={manejarMovimiento}
      onMouseLeave={manejarSalida}
      onClick={manejarClick}
    >
      <span className="gallery-card-border-glow" aria-hidden="true" />

      <div className="gallery-magic-media">
        {item.tipo === 'video' ? (
          <video src={mediaUrl} controls preload="metadata" />
        ) : (
          <img src={mediaUrl} alt={publication.titulo} loading="lazy" />
        )}
        {publication.medios.length > 1 && (
          <span className="gallery-media-count">
            1 / {publication.medios.length}
          </span>
        )}
        <span className="gallery-media-type">
          {item.tipo === 'video' ? 'Video' : 'Imagen'}
        </span>
      </div>

      <div className="gallery-magic-content">
        <span className="gallery-card-label">Clinica Casas</span>
        <h2>{publication.titulo}</h2>
        {publication.descripcion && <p>{publication.descripcion}</p>}
      </div>
    </article>
  );
}

function GalleryMagicBento({ publications, getMediaUrl, onOpen }) {
  const gridRef = useRef(null);
  const spotlightRef = useRef(null);
  const isDesktop = useDesktopDetection();
  const [paginaActiva, setPaginaActiva] = useState(0);

  const desplazarCarrusel = (direccion) => {
    const carrusel = gridRef.current;
    if (!carrusel) return;

    carrusel.scrollBy({
      left: carrusel.clientWidth * .82 * direccion,
      behavior: 'smooth'
    });
  };

  const actualizarPagina = () => {
    const carrusel = gridRef.current;
    if (!carrusel?.clientWidth) return;

    setPaginaActiva(Math.round(carrusel.scrollLeft / (carrusel.clientWidth * .82)));
  };

  const totalPaginas = Math.max(1, Math.ceil(publications.length / 3));

  useEffect(() => {
    if (!isDesktop || !gridRef.current) return undefined;

    const spotlight = document.createElement('span');
    spotlight.className = 'gallery-global-spotlight';
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const manejarMovimiento = (event) => {
      const grid = gridRef.current;
      if (!grid || !spotlightRef.current) return;

      const rect = grid.getBoundingClientRect();
      const dentro = (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      );

      gsap.to(spotlightRef.current, {
        left: event.clientX,
        top: event.clientY,
        opacity: dentro ? .8 : 0,
        duration: dentro ? .14 : .35,
        ease: 'power2.out'
      });
    };

    document.addEventListener('mousemove', manejarMovimiento);

    return () => {
      document.removeEventListener('mousemove', manejarMovimiento);
      spotlight.remove();
      spotlightRef.current = null;
    };
  }, [isDesktop]);

  return (
    <section className="gallery-carousel-shell" aria-label="Publicaciones de la galeria">
      {publications.length > 3 && (
        <button
          type="button"
          className="gallery-carousel-control previous"
          onClick={() => desplazarCarrusel(-1)}
          disabled={paginaActiva === 0}
          aria-label="Ver publicaciones anteriores"
        >
          {'<'}
        </button>
      )}

      <div
        ref={gridRef}
        className={`galeria-grid gallery-magic-grid ${isDesktop ? 'animations-enabled' : ''}`}
        onScroll={actualizarPagina}
      >
        {publications.map((publication) => (
          <GalleryBentoCard
            key={publication.id}
            publication={publication}
            getMediaUrl={getMediaUrl}
            animationsEnabled={isDesktop}
            onOpen={onOpen}
          />
        ))}
      </div>

      {publications.length > 3 && (
        <button
          type="button"
          className="gallery-carousel-control next"
          onClick={() => desplazarCarrusel(1)}
          disabled={paginaActiva >= totalPaginas - 1}
          aria-label="Ver publicaciones siguientes"
        >
          {'>'}
        </button>
      )}
    </section>
  );
}

export default GalleryMagicBento;
