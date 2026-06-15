import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatearFechaLocal } from '../utils/fechas';

function DashboardHome() {
  const [pacientes, setPacientes] = useState(0);
  const [citasMes, setCitasMes] = useState(0);
  const [servicios, setServicios] = useState(0);
  const [citasHoy, setCitasHoy] = useState([]);

  async function obtenerDatosDashboard() {
    const hoy = formatearFechaLocal();

    const fechaActual = new Date();
    const inicioMes = formatearFechaLocal(new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth(),
      1
    ));

    const finMes = formatearFechaLocal(new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth() + 1,
      0
    ));

    const { data: pacientesData } = await supabase
      .from('pacientes')
      .select('id');

    const { data: citasMesData } = await supabase
      .from('citas')
      .select('id')
      .gte('fecha', inicioMes)
      .lte('fecha', finMes);

    const { data: serviciosData } = await supabase
      .from('citas')
      .select('servicio');

    const { data: citasHoyData } = await supabase
      .from('citas')
      .select('*')
      .eq('fecha', hoy)
      .neq('estatus', 'Cancelada')
      .order('hora', { ascending: true });

    setPacientes(pacientesData?.length || 0);
    setCitasMes(citasMesData?.length || 0);

    const serviciosUnicos = new Set(
      (serviciosData || [])
        .map((item) => item.servicio)
        .filter(Boolean)
    );

    setServicios(serviciosUnicos.size);
    setCitasHoy(citasHoyData || []);
  }

  useEffect(() => {
    obtenerDatosDashboard();
  }, []);

  const formatearHora = (hora) => {
    if (!hora) return '';

    return hora.slice(0, 5);
  };

  return (
    <div className="dashboard-home">
      <div className="cards-grid">
        <div className="card-kpi">
          <h3>Pacientes</h3>
          <span>{pacientes}</span>
        </div>

        <div className="card-kpi">
          <h3>Citas del mes</h3>
          <span>{citasMes}</span>
        </div>

        <div className="card-kpi">
          <h3>Citas hoy</h3>
          <span>{citasHoy.length}</span>
        </div>

        <div className="card-kpi">
          <h3>Servicios</h3>
          <span>{servicios}</span>
        </div>
      </div>

      <section className="dashboard-section">
        <h2>Próximas citas de hoy</h2>

        {citasHoy.length === 0 && (
          <p className="empty">No hay citas programadas para hoy.</p>
        )}

        <div className="citas-hoy-lista">
          {citasHoy.map((cita) => (
            <div key={cita.id} className={`cita-hoy-card ${cita.estatus?.toLowerCase()}`}>
              <div>
                <strong>{formatearHora(cita.hora)}</strong>
                <p>{cita.nombre_paciente}</p>
              </div>

              <div>
                <span>{cita.servicio}</span>
                <small>{cita.estatus}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DashboardHome;
