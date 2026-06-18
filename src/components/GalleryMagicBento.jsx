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

function GalleryBentoCard({ item, mediaUrl, animationsEnabled }) {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);

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
    if (!animationsEnabled || !element || event.target.closest('video')) return;

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
          <img src={mediaUrl} alt={item.titulo} loading="lazy" />
        )}
        <span className="gallery-media-type">
          {item.tipo === 'video' ? 'Video' : 'Imagen'}
        </span>
      </div>

      <div className="gallery-magic-content">
        <span className="gallery-card-label">Clinica Casas</span>
        <h2>{item.titulo}</h2>
        {item.descripcion && <p>{item.descripcion}</p>}
      </div>
    </article>
  );
}

function GalleryMagicBento({ items, getMediaUrl }) {
  const gridRef = useRef(null);
  const spotlightRef = useRef(null);
  const isDesktop = useDesktopDetection();

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
    <section
      ref={gridRef}
      className={`galeria-grid gallery-magic-grid ${isDesktop ? 'animations-enabled' : ''}`}
    >
      {items.map((item) => (
        <GalleryBentoCard
          key={item.id}
          item={item}
          mediaUrl={getMediaUrl(item.ruta_archivo)}
          animationsEnabled={isDesktop}
        />
      ))}
    </section>
  );
}

export default GalleryMagicBento;
