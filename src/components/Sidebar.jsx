import { NavLink } from 'react-router-dom';
import { useState } from 'react';

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={collapsed ? 'sidebar collapsed' : 'sidebar'}>
      <div className="sidebar-header">

        <button
          className="menu-toggle"
          onClick={() => setCollapsed(!collapsed)}
        >
          ☰
        </button>

        {!collapsed && (
          <>
            <img
              src="/logo.png"
              alt="Clínica Casas"
              className="logo-sidebar"
            />
          </>
        )}
      </div>

      <nav>

        <NavLink to="/admin">
          🏠 {!collapsed && 'Dashboard'}
        </NavLink>

        <NavLink to="/admin/calendario">
          📅 {!collapsed && 'Calendario'}
        </NavLink>

        <NavLink to="/admin/pacientes">
          👨‍👩‍👧 {!collapsed && 'Pacientes'}
        </NavLink>

        <NavLink to="/admin/servicios">
          📈 {!collapsed && 'Servicios'}
        </NavLink>

        <NavLink to="/login">
          🚪 {!collapsed && 'Cerrar sesión'}
        </NavLink>

      </nav>
    </aside>
  );
}

export default Sidebar;