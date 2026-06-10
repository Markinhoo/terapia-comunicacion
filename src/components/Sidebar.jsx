import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const cerrarMenuMovil = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* BOTÓN HAMBURGUESA MÓVIL */}

      <button
        className="mobile-menu-button"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* OVERLAY */}

      {mobileOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={cerrarMenuMovil}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`
          sidebar
          ${collapsed ? 'collapsed' : ''}
          ${mobileOpen ? 'mobile-open' : ''}
        `}
      >
        <div className="sidebar-header">

          <button
            className="menu-toggle desktop-toggle"
            onClick={() => setCollapsed(!collapsed)}
          >
            ☰
          </button>

        </div>

        <nav className="sidebar-nav">

          <NavLink
            to="/admin"
            onClick={cerrarMenuMovil}
          >
            <span className="sidebar-icon">🏠</span>

            {(!collapsed || mobileOpen) && (
              <span className="sidebar-text">
                Dashboard
              </span>
            )}
          </NavLink>

          <NavLink
            to="/admin/calendario"
            onClick={cerrarMenuMovil}
          >
            <span className="sidebar-icon">📅</span>

            {(!collapsed || mobileOpen) && (
              <span className="sidebar-text">
                Calendario
              </span>
            )}
          </NavLink>

          <NavLink
            to="/admin/pacientes"
            onClick={cerrarMenuMovil}
          >
            <span className="sidebar-icon">👨‍👩‍👧</span>

            {(!collapsed || mobileOpen) && (
              <span className="sidebar-text">
                Pacientes
              </span>
            )}
          </NavLink>

          <NavLink
            to="/admin/servicios"
            onClick={cerrarMenuMovil}
          >
            <span className="sidebar-icon">📈</span>

            {(!collapsed || mobileOpen) && (
              <span className="sidebar-text">
                Servicios
              </span>
            )}
          </NavLink>

          <button
            className="logout-link"
            onClick={cerrarSesion}
          >
            <span className="sidebar-icon">🚪</span>

            {(!collapsed || mobileOpen) && (
              <span className="sidebar-text">
                Cerrar sesión
              </span>
            )}
          </button>

        </nav>
      </aside>
    </>
  );
}

export default Sidebar;