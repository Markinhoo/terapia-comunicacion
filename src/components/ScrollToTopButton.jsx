import { useEffect, useState } from 'react';
import { FaArrowUp } from 'react-icons/fa6';

function obtenerContenedorScroll() {
  return document.querySelector('.dashboard-content') || window;
}

function obtenerScrollTop(contenedor) {
  return contenedor === window
    ? window.scrollY
    : contenedor.scrollTop;
}

function ScrollToTopButton({ routeKey }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let contenedor = obtenerContenedorScroll();

    const revisarScroll = () => {
      setVisible(obtenerScrollTop(contenedor) > 280);
    };

    const configurarListener = () => {
      contenedor.removeEventListener?.('scroll', revisarScroll);
      contenedor = obtenerContenedorScroll();
      contenedor.addEventListener('scroll', revisarScroll, { passive: true });
      revisarScroll();
    };

    configurarListener();
    window.addEventListener('resize', configurarListener);

    return () => {
      contenedor.removeEventListener?.('scroll', revisarScroll);
      window.removeEventListener('resize', configurarListener);
    };
  }, [routeKey]);

  const subirArriba = () => {
    const contenedor = obtenerContenedorScroll();

    if (contenedor === window) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    contenedor.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      className={`scroll-top-button ${visible ? 'visible' : ''}`}
      onClick={subirArriba}
      aria-label="Subir al inicio de la pagina"
    >
      <FaArrowUp aria-hidden="true" />
    </button>
  );
}

export default ScrollToTopButton;
