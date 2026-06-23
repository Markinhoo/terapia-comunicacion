import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatearFechaLocal } from '../utils/fechas';
import {
  citaVisibleEnAgenda,
  estadoCitaActual,
  sincronizarCitasEnCurso
} from '../utils/citas';

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
      .neq('estatus', 'Cancelada')
      .neq('estatus', 'Pagada')
      .lte('fecha', hoy)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });

    const ahora = new Date();
    await sincronizarCitasEnCurso(supabase, citasHoyData || [], ahora);

    setPacientes(pacientesData?.length || 0);
    setCitasMes(citasMesData?.length || 0);

    const serviciosUnicos = new Set(
      (serviciosData || [])
        .map((item) => item.servicio)
        .filter(Boolean)
    );

    setServicios(serviciosUnicos.size);
    setCitasHoy(
      (citasHoyData || [])
        .map((cita) => ({
          ...cita,
          estatus: estadoCitaActual(cita, ahora)
        }))
        .filter((cita) => {
          if (cita.estatus === 'Pagada' || cita.estatus === 'Cancelada') return false;
          if (cita.estatus === 'Pendiente de pago') return true;
          if (cita.fecha !== hoy) return false;
          return citaVisibleEnAgenda(cita, ahora);
        })
        .sort((a, b) => {
          if (a.estatus === 'En curso' && b.estatus !== 'En curso') return -1;
          if (a.estatus !== 'En curso' && b.estatus === 'En curso') return 1;
          if (a.estatus === 'Pendiente de pago' && b.estatus !== 'Pendiente de pago') return -1;
          if (a.estatus !== 'Pendiente de pago' && b.estatus === 'Pendiente de pago') return 1;
          return `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`);
        })
    );
  }

  useEffect(() => {
    obtenerDatosDashboard();
  }, []);

  const formatearHora = (hora) => {
    if (!hora) return '';

    return hora.slice(0, 5);
  };

  const formatearDia = (fecha) => {
    const hoy = formatearFechaLocal();
    const ayerDate = new Date(`${hoy}T00:00:00`);
    ayerDate.setDate(ayerDate.getDate() - 1);
    const ayer = formatearFechaLocal(ayerDate);

    if (fecha === hoy) return 'Hoy';
    if (fecha === ayer) return 'Ayer';

    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(`${fecha}T00:00:00`));
  };

  const citasPorDia = citasHoy.reduce((grupos, cita) => {
    const fecha = cita.fecha || 'Sin fecha';

    if (!grupos[fecha]) {
      grupos[fecha] = [];
    }

    grupos[fecha].push(cita);
    return grupos;
  }, {});

  return (
    <div className="dashboard-home">
      <section className="dashboard-section dashboard-appointments">
        <h2>Citas en curso, próximas y pendientes de pago</h2>

        {citasHoy.length === 0 && (
          <p className="empty">No hay citas en curso, próximas o pendientes de pago.</p>
        )}

        <div className="citas-dia-lista">
          {Object.entries(citasPorDia).map(([fecha, citas]) => (
            <article key={fecha} className="citas-dia-grupo">
              <header>
                <strong>{formatearDia(fecha)}</strong>
                <span>
                  {citas.length} cita{citas.length === 1 ? '' : 's'}
                </span>
              </header>

              <div className="citas-hoy-lista">
                {citas.map((cita) => (
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
            </article>
          ))}
        </div>
      </section>

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
    </div>
  );
}

export default DashboardHome;
