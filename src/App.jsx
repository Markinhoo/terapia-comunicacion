import { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { FaCalendarPlus, FaHouse, FaImages } from 'react-icons/fa6';
import { FaWhatsapp } from 'react-icons/fa';
import Inicio from './pages/Inicio';
import AgendarCita from './pages/AgendarCita';
import Galeria from './pages/Galeria';
import LoginAdmin from './pages/LoginAdmin';
import PanelAdmin from './pages/PanelAdmin';
import ProtectedRoute from './components/ProtectedRoute';
import ThemeToggle from './components/ThemeToggle';
import WhatsAppFloat from './components/WhatsAppFloat';
import ScrollToTopButton from './components/ScrollToTopButton';
import { supabase } from './lib/supabaseClient';

function obtenerTemaInicial() {
  const temaGuardado = window.localStorage.getItem('theme');

  if (temaGuardado === 'light' || temaGuardado === 'dark') {
    return temaGuardado;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(obtenerTemaInicial);
  const [userName, setUserName] = useState('');
  const [touchStart, setTouchStart] = useState(null);
  const isAdminRoute = location.pathname.startsWith('/admin');
  const whatsappUrl = `https://wa.me/526182363755?text=${encodeURIComponent(
    'Hola, me gustaria solicitar informacion sobre terapia de comunicacion humana.'
  )}`;

  useEffect(() => {
    let active = true;

    const actualizarUsuario = (session) => {
      const email = session?.user?.email || '';
      const nombre = email.split('@')[0] || '';
      const nombreLimpio = nombre
        .replace(/[._-]+/g, ' ')
        .trim()
        .replace(/\b\w/g, (letra) => letra.toUpperCase());

      if (active) {
        setUserName(nombreLimpio);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      actualizarUsuario(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      actualizarUsuario(session);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const rutasPublicas = ['/', '/agendar', '/galeria'];

  const iniciarDeslizamiento = (event) => {
    if (
      window.innerWidth > 820 ||
      isAdminRoute ||
      event.target.closest(
        '.hero-carousel, .instagram-media-carousel, .servicios-carousel-mobile, video, input, textarea, select, button, a'
      )
    ) {
      setTouchStart(null);
      return;
    }

    const touch = event.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const terminarDeslizamiento = (event) => {
    if (!touchStart || window.innerWidth > 820 || isAdminRoute) return;

    const touch = event.changedTouches[0];
    const diferenciaX = touch.clientX - touchStart.x;
    const diferenciaY = touch.clientY - touchStart.y;
    setTouchStart(null);

    if (Math.abs(diferenciaX) < 70 || Math.abs(diferenciaX) <= Math.abs(diferenciaY) * 1.25) {
      return;
    }

    const indiceActual = rutasPublicas.indexOf(location.pathname);
    if (indiceActual === -1) return;

    const direccion = diferenciaX < 0 ? 1 : -1;
    const siguienteIndice = indiceActual + direccion;

    if (siguienteIndice >= 0 && siguienteIndice < rutasPublicas.length) {
      navigate(rutasPublicas[siguienteIndice]);
    }
  };

  return (
    <>
      <nav className={`navbar ${isAdminRoute ? 'admin-navbar' : ''}`}>
        <NavLink to="/" className="brand" aria-label="Ir al inicio">
          <img src="/logo.png" alt="Clinica Casas" className="brand-logo" />
          <span className="brand-copy">
            <strong>Clinica Casas</strong>
            <small>Comunicacion humana</small>
          </span>
        </NavLink>

        <div className="navbar-actions">
          {isAdminRoute && userName && (
            <div className="admin-mobile-welcome">
              Bienvenido {userName}
            </div>
          )}

          <div className="navbar-links" aria-label="Navegacion principal">
            <NavLink to="/" end>
              <FaHouse aria-hidden="true" />
              <span>Inicio</span>
            </NavLink>

            <NavLink to="/agendar">
              <FaCalendarPlus aria-hidden="true" />
              <span>Agendar cita</span>
            </NavLink>

            <NavLink to="/galeria">
              <FaImages aria-hidden="true" />
              <span>Galeria</span>
            </NavLink>

          </div>

          <ThemeToggle
            theme={theme}
            onToggle={() => {
              setTheme((actual) => (actual === 'dark' ? 'light' : 'dark'));
            }}
          />
        </div>
      </nav>

      {!isAdminRoute && (
        <nav className="mobile-bottom-nav" aria-label="Navegacion movil">
          <NavLink to="/" end>
            <FaHouse aria-hidden="true" />
            <span>Inicio</span>
          </NavLink>

          <NavLink to="/agendar">
            <FaCalendarPlus aria-hidden="true" />
            <span>Agendar</span>
          </NavLink>

          <NavLink to="/galeria">
            <FaImages aria-hidden="true" />
            <span>Galeria</span>
          </NavLink>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-whatsapp-link"
          >
            <FaWhatsapp aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
        </nav>
      )}

      <div
        className="page-swipe-surface"
        onTouchStart={iniciarDeslizamiento}
        onTouchEnd={terminarDeslizamiento}
        onTouchCancel={() => setTouchStart(null)}
      >
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/agendar" element={<AgendarCita />} />
          <Route path="/galeria" element={<Galeria />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute fallback={<LoginAdmin />}>
                <PanelAdmin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      {!location.pathname.startsWith('/admin') && <WhatsAppFloat />}

      <ScrollToTopButton routeKey={location.pathname} />
    </>
  );
}

export default App;
