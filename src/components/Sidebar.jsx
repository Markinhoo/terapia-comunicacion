import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  FaCalendarDays,
  FaChartLine,
  FaChevronLeft,
  FaHouse,
  FaImages,
  FaRightFromBracket,
  FaUserGear,
  FaUserGroup,
  FaXmark
} from 'react-icons/fa6';
import { supabase } from '../lib/supabaseClient';
import { puedeVerRuta } from '../utils/roles';

const menuItems = [
  {
    to: '/admin',
    routeKey: '',
    label: 'Inicio',
    Icon: FaHouse
  },
  {
    to: '/admin/calendario',
    routeKey: 'calendario',
    label: 'Calendario',
    Icon: FaCalendarDays
  },
  {
    to: '/admin/pacientes',
    routeKey: 'pacientes',
    label: 'Pacientes',
    Icon: FaUserGroup
  },
  {
    to: '/admin/servicios',
    routeKey: 'servicios',
    label: 'Servicios',
    Icon: FaChartLine
  },
  {
    to: '/admin/usuarios',
    routeKey: 'usuarios',
    label: 'Usuarios',
    Icon: FaUserGear
  },
  {
    to: '/admin/galeria',
    routeKey: 'galeria',
    label: 'Galeria',
    Icon: FaImages
  }
];

function Sidebar({ role }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const cerrarMenuMovil = () => {
    setMobileOpen(false);
  };

  const manejarNavegacion = () => {
    if (window.innerWidth > 768) {
      setCollapsed(true);
      return;
    }

    cerrarMenuMovil();
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
          {(!collapsed || mobileOpen) && (
            <div className="sidebar-title">
              <strong>Panel admin</strong>
              <small>Gestion de citas</small>
            </div>
          )}

          <button
            className="menu-toggle desktop-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menu' : 'Contraer menu'}
          >
            <FaChevronLeft className={collapsed ? 'rotated' : ''} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems
            .filter((item) => puedeVerRuta(role, item.routeKey))
            .map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} onClick={manejarNavegacion} end={to === '/admin'}>
                <span className="sidebar-icon"><Icon /></span>
                {(!collapsed || mobileOpen) && (
                  <span className="sidebar-text">{label}</span>
                )}
              </NavLink>
            ))}

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
