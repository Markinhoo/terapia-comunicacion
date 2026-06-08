import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <aside className={collapsed ? 'sidebar collapsed' : 'sidebar'}>
      <div className="sidebar-header">
        <button
          className="menu-toggle"
          onClick={() => setCollapsed(!collapsed)}
        >
          ☰
        </button>
      </div>

      <nav className="sidebar-nav">
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

        <button className="logout-link" onClick={cerrarSesion}>
          🚪 {!collapsed && 'Cerrar sesión'}
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;