import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import AccessDenied from '../components/AccessDenied';
import DashboardHome from '../components/DashboardHome';
import RoleRoute from '../components/RoleRoute';
import CalendarioCitas from './CalendarioCitas';
import Pacientes from './Pacientes';
import Servicios from './Servicios';
import ExpedienteClinico from './ExpedienteClinico';
import UsuariosAdmin from './UsuariosAdmin';
import GaleriaAdmin from './GaleriaAdmin';
import { supabase } from '../lib/supabaseClient';
import { ROLES } from '../utils/roles';

function PanelAdmin() {
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    let active = true;

    async function cargarRol() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) {
        if (active) {
          setRole(ROLES.USER);
          setLoadingRole(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('app_profiles')
        .select('role, active')
        .eq('id', userId)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error(error);
      }

      setRole(data?.active === false ? ROLES.USER : (data?.role || ROLES.USER));
      setLoadingRole(false);
    }

    cargarRol();

    return () => {
      active = false;
    };
  }, []);

  if (loadingRole) {
    return <p className="auth-loading">Cargando permisos...</p>;
  }

  return (
    <div className="dashboard-layout">

      <Sidebar role={role} />

      <main className="dashboard-content">

        <Routes>

          <Route
            index
            element={<DashboardHome />}
          />

          <Route
            path="calendario"
            element={<CalendarioCitas />}
          />

          <Route
            path="pacientes"
            element={
              <RoleRoute role={role} routeKey="pacientes">
                <Pacientes />
              </RoleRoute>
            }
          />

          <Route
            path="servicios"
            element={
              <RoleRoute role={role} routeKey="servicios">
                <Servicios />
              </RoleRoute>
            }
          />

          <Route
            path="usuarios"
            element={
              <RoleRoute role={role} routeKey="usuarios">
                <UsuariosAdmin />
              </RoleRoute>
            }
          />

          <Route
            path="galeria"
            element={
              <RoleRoute role={role} routeKey="galeria">
                <GaleriaAdmin />
              </RoleRoute>
            }
          />

          <Route
            path="expediente/:pacienteId"
            element={
              <RoleRoute role={role} routeKey="expediente">
                <ExpedienteClinico />
              </RoleRoute>
            }
          />

          <Route path="*" element={<AccessDenied />} />

        </Routes>

      </main>

    </div>
  );
}

export default PanelAdmin;
