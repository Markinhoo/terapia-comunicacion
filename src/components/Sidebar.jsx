import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  FaCalendarDays,
  FaChartLine,
  FaChevronLeft,
  FaHouse,
  FaRightFromBracket,
  FaUserGroup,
  FaXmark
} from 'react-icons/fa6';
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
      <button
        className="mobile-menu-button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Cerrar menu' : 'Abrir menu'}
      >
        {mobileOpen ? <FaXmark /> : <span aria-hidden="true">☰</span>}
      </button>

      {mobileOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={cerrarMenuMovil}
        />
      )}

      <aside
        className={`
          sidebar
          ${collapsed ? 'collapsed' : ''}
          ${mobileOpen ? 'mobile-open' : ''}
        `}
      >
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="" />
            {(!collapsed || mobileOpen) && (
              <span>
                <strong>Clinica Casas</strong>
                <small>Panel administrativo</small>
              </span>
            )}
          </div>

          <button
            className="menu-toggle desktop-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menu' : 'Contraer menu'}
          >
            <FaChevronLeft className={collapsed ? 'rotated' : ''} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin" onClick={cerrarMenuMovil}>
            <span className="sidebar-icon"><FaHouse /></span>
            {(!collapsed || mobileOpen) && (
              <span className="sidebar-text">Dashboard</span>
            )}
          </NavLink>

          <NavLink to="/admin/calendario" onClick={cerrarMenuMovil}>
            <span className="sidebar-icon"><FaCalendarDays /></span>
            {(!collapsed || mobileOpen) && (
              <span className="sidebar-text">Calendario</span>
            )}
          </NavLink>

          <NavLink to="/admin/pacientes" onClick={cerrarMenuMovil}>
            <span className="sidebar-icon"><FaUserGroup /></span>
            {(!collapsed || mobileOpen) && (
              <span className="sidebar-text">Pacientes</span>
            )}
          </NavLink>

          <NavLink to="/admin/servicios" onClick={cerrarMenuMovil}>
            <span className="sidebar-icon"><FaChartLine /></span>
            {(!collapsed || mobileOpen) && (
              <span className="sidebar-text">Servicios</span>
            )}
          </NavLink>

          <button className="logout-link" onClick={cerrarSesion}>
            <span className="sidebar-icon"><FaRightFromBracket /></span>
            {(!collapsed || mobileOpen) && (
              <span className="sidebar-text">Cerrar sesion</span>
            )}
          </button>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
