import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import AccessDenied from '../components/AccessDenied';
import DashboardHome from '../components/DashboardHome';
import RoleRoute from '../components/RoleRoute';
import ClinicLoader from '../components/ClinicLoader';
import { supabase } from '../lib/supabaseClient';
import { ROLES } from '../utils/roles';
import { useClinica } from '../contexts/clinica';

const CalendarioCitas = lazy(() => import('./CalendarioCitas'));
const Pacientes = lazy(() => import('./Pacientes'));
const Servicios = lazy(() => import('./Servicios'));
const ExpedienteClinico = lazy(() => import('./ExpedienteClinico'));
const UsuariosAdmin = lazy(() => import('./UsuariosAdmin'));
const GaleriaAdmin = lazy(() => import('./GaleriaAdmin'));
const Finanzas = lazy(() => import('./Finanzas'));
const AparienciaClinica = lazy(() => import('./AparienciaClinica'));
const WhatsAppInbox = lazy(() => import('./WhatsAppInbox'));

function PanelAdmin() {
  const clinica = useClinica();
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

  useEffect(() => {
    let timeoutId;
    const eventosActividad = ['mousemove', 'keydown', 'click', 'touchstart'];

    const cerrarPorInactividad = async () => {
      await supabase.auth.signOut();
      window.location.assign(`/${clinica.slug}/admin`);
    };

    const reiniciarTemporizador = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(cerrarPorInactividad, 30 * 60 * 1000);
    };

    eventosActividad.forEach((evento) => {
      window.addEventListener(evento, reiniciarTemporizador, { passive: true });
    });
    reiniciarTemporizador();

    return () => {
      window.clearTimeout(timeoutId);
      eventosActividad.forEach((evento) => {
        window.removeEventListener(evento, reiniciarTemporizador);
      });
    };
  }, [clinica.slug]);

  if (loadingRole) {
    return <ClinicLoader clinica={clinica} label="Cargando permisos..." />;
  }

  return (
    <div className="dashboard-layout">

      <Sidebar role={role} />

      <main className="dashboard-content">

        <Suspense fallback={<ClinicLoader clinica={clinica} label="Cargando sección..." />}>
        <Routes>

          <Route
            index
            element={<DashboardHome />}
          />

          <Route
            path="calendario"
            element={<CalendarioCitas readOnly={role === ROLES.USER} />}
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
            path="apariencia"
            element={
              <RoleRoute role={role} routeKey="apariencia">
                <AparienciaClinica />
              </RoleRoute>
            }
          />

          <Route
            path="finanzas"
            element={
              <RoleRoute role={role} routeKey="finanzas">
                <Finanzas />
              </RoleRoute>
            }
          />

          <Route
            path="whatsapp"
            element={
              <RoleRoute role={role} routeKey="whatsapp">
                <WhatsAppInbox />
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
        </Suspense>

      </main>

    </div>
  );
}

export default PanelAdmin;


