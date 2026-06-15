import { Routes, Route } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import DashboardHome from '../components/DashboardHome';
import CalendarioCitas from './CalendarioCitas';
import Pacientes from './Pacientes';
import Servicios from './Servicios';
import ExpedienteClinico from './ExpedienteClinico';

function PanelAdmin() {
  return (
    <div className="dashboard-layout">

      <Sidebar />

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
            element={<Pacientes />}
          />

          <Route
            path="servicios"
            element={<Servicios />}
          />

          <Route
            path="expediente/:pacienteId"
            element={<ExpedienteClinico />}
          />

        </Routes>

      </main>

    </div>
  );
}

export default PanelAdmin;
