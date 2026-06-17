import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { FaCalendarPlus, FaHouse, FaImages, FaLock } from 'react-icons/fa6';
import Inicio from './pages/Inicio';
import AgendarCita from './pages/AgendarCita';
import Galeria from './pages/Galeria';
import LoginAdmin from './pages/LoginAdmin';
import PanelAdmin from './pages/PanelAdmin';
import ProtectedRoute from './components/ProtectedRoute';
import ThemeToggle from './components/ThemeToggle';
import WhatsAppFloat from './components/WhatsAppFloat';

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
  const [theme, setTheme] = useState(obtenerTemaInicial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <>
      <nav className="navbar">
        <NavLink to="/" className="brand" aria-label="Ir al inicio">
          <img src="/logo.png" alt="Clinica Casas" className="brand-logo" />
          <span className="brand-copy">
            <strong>Clinica Casas</strong>
            <small>Comunicacion humana</small>
          </span>
        </NavLink>

        <div className="navbar-actions">
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

            <NavLink
              to="/login"
              className={({ isActive }) => (
                isActive || location.pathname.startsWith('/admin')
                  ? 'active'
                  : undefined
              )}
            >
              <FaLock aria-hidden="true" />
              <span>Admin</span>
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

      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/agendar" element={<AgendarCita />} />
        <Route path="/galeria" element={<Galeria />} />
        <Route path="/login" element={<LoginAdmin />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <PanelAdmin />
            </ProtectedRoute>
          }
        />
      </Routes>

      {!location.pathname.startsWith('/admin') &&
        location.pathname !== '/login' &&
        <WhatsAppFloat />
      }
    </>
  );
}

export default App;
