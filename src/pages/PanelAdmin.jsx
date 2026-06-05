import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function PanelAdmin() {
  const [citas, setCitas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    validarSesion();
    obtenerCitas();
  }, []);

  const validarSesion = async () => {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      navigate('/login');
    }
  };

  const obtenerCitas = async () => {
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });

    if (!error) {
      setCitas(data);
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const confirmar = async (id) => {
    const { error } = await supabase
      .from('citas')
      .update({
        confirmado: true,
        estatus: 'Confirmada',
        fecha_confirmacion: new Date()
      })
      .eq('id', id);

    if (!error) {
      obtenerCitas();
    }
  };

  const cancelar = async (id) => {
    const { error } = await supabase
      .from('citas')
      .update({
        confirmado: false,
        estatus: 'Cancelada'
      })
      .eq('id', id);

    if (!error) {
      obtenerCitas();
    }
  };

  const marcarAsistio = async (id) => {
    const { error } = await supabase
      .from('citas')
      .update({
        asistio: true
      })
      .eq('id', id);

    if (!error) {
      obtenerCitas();
    }
  };

  const fechaHoy = new Date().toISOString().split('T')[0];

  const citasHoy = citas.filter((cita) => cita.fecha === fechaHoy).length;
  const pendientes = citas.filter((cita) => cita.estatus === 'Pendiente').length;
  const confirmadas = citas.filter((cita) => cita.estatus === 'Confirmada').length;
  const canceladas = citas.filter((cita) => cita.estatus === 'Cancelada').length;

  const citasFiltradas = citas.filter((cita) => {
    const texto = `
      ${cita.nombre_paciente || ''}
      ${cita.nombre_responsable || ''}
      ${cita.telefono || ''}
      ${cita.servicio || ''}
      ${cita.estatus || ''}
    `.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const crearMensajeWhatsApp = (cita) => {
    return encodeURIComponent(
      `Hola, buen día. Le contactamos de Terapia de Comunicación Humana para confirmar la cita de ${cita.nombre_paciente} el día ${cita.fecha} a las ${cita.hora}.`
    );
  };

  const guardarObservacion = async (id, observaciones) => {
  const { error } = await supabase
    .from('citas')
    .update({ observaciones })
    .eq('id', id);

  if (!error) {
    obtenerCitas();
  }
};
const servicios = Object.values(
  citas.reduce((acc, cita) => {
    if (!acc[cita.servicio]) {
      acc[cita.servicio] = {
        servicio: cita.servicio,
        total: 0
      };
    }

    acc[cita.servicio].total += 1;
    return acc;
  }, {})
);
  return (
    <main className="container">
      <div className="admin-header">
        <div>
          <h1>Panel administrativo</h1>
          <p className="subtitle">Gestión de citas agendadas.</p>
        </div>
        <div className="admin-actions">
          <button onClick={() => navigate('/calendario')}>Calendario</button>
          <button onClick={() => navigate('/pacientes')}>Pacientes</button>
          <button onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </div>

      <section className="dashboard">
        <div className="dashboard-card">
          <h2>{citasHoy}</h2>
          <p>Citas hoy</p>
        </div>

        <div className="dashboard-card">
          <h2>{pendientes}</h2>
          <p>Pendientes</p>
        </div>

        <div className="dashboard-card">
          <h2>{confirmadas}</h2>
          <p>Confirmadas</p>
        </div>

        <div className="dashboard-card">
          <h2>{canceladas}</h2>
          <p>Canceladas</p>
        </div>
      </section>

      <section className="chart-card">
  <h2>Servicios más solicitados</h2>

  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={servicios}>
      <XAxis dataKey="servicio" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="total" />
    </BarChart>
  </ResponsiveContainer>
</section>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Buscar por paciente, responsable, teléfono o servicio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Edad</th>
              <th>Responsable</th>
              <th>Teléfono</th>
              <th>Servicio</th>
              <th>Modalidad</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Estatus</th>
              <th>Observaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {citasFiltradas.map((cita) => (
              <tr key={cita.id}>
                <td>{cita.nombre_paciente}</td>
                <td>{cita.edad}</td>
                <td>{cita.nombre_responsable}</td>
                <td>{cita.telefono}</td>
                <td>{cita.servicio}</td>
                <td>{cita.modalidad}</td>
                <td>{cita.fecha}</td>
                <td>{cita.hora}</td>
                <td>
                  <span className={`badge ${cita.estatus?.toLowerCase()}`}>
                    {cita.estatus}
                  </span>
                </td>
                <td>
                  <textarea
                  defaultValue={cita.observaciones || ''}
                  placeholder="Observaciones"
                  onBlur={(e) => guardarObservacion(cita.id, e.target.value)}
                  />
                </td>
                <td className="acciones">
                  <button onClick={() => confirmar(cita.id)}>
                    Confirmar
                  </button>

                  <button className="btn-danger" onClick={() => cancelar(cita.id)}>
                    Cancelar
                  </button>

                  <button className="btn-secondary" onClick={() => marcarAsistio(cita.id)}>
                    Asistió
                  </button>
                  <button className="btn-secondary" onClick={() => navigate(`/expediente/${cita.paciente_id}`)}>
                    Expediente
                  </button>

                  <a
                    className="btn-whatsapp"
                    href={`https://wa.me/52${cita.telefono}?text=${crearMensajeWhatsApp(cita)}`}
                    target="_blank"
                  >
                    WhatsApp
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {citasFiltradas.length === 0 && (
        <p className="empty">No se encontraron citas.</p>
      )}
    </main>
  );
}

export default PanelAdmin;