import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Inicio from './pages/Inicio';
import AgendarCita from './pages/AgendarCita';
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
        <div className="brand">
          <img src="/logo.png" alt="Clínica Casas" className="brand-logo" />
          <h2>Clínica Casas</h2>
        </div>
        
        <div className="navbar-actions">
          <div className="navbar-links">
            <Link to="/">Inicio</Link>
            <Link to="/agendar">Agendar cita</Link>
            <Link to="/login">Admin</Link>
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

       {!location.pathname.startsWith('/admin') &&  location.pathname !== '/login' &&
        <WhatsAppFloat />
      }
    </>
  );
}

export default App;
