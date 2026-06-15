import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { formatearFechaLocal } from '../utils/fechas';

const servicios = [
  'Evaluación inicial',
  'Terapia de lenguaje infantil',
  'Estimulación temprana',
  'Problemas de articulación',
  'Dificultades de lectoescritura',
  'Terapia para adultos',
  'Orientación a padres'
];

const horasGenerales = Array.from({ length: 9 }, (_, index) => {
  const minutos = 9 * 60 + index * 30;
  const hora = String(Math.floor(minutos / 60)).padStart(2, '0');
  const minuto = String(minutos % 60).padStart(2, '0');
  return `${hora}:${minuto}:00`;
});

const nombresMes = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const crearFechaLocal = (year, month, day) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const crearCitaSeleccionada = (fecha, hora, horarios = []) => ({
  id: crypto.randomUUID(),
  fecha,
  hora,
  horarios,
  cargando: false
});

function Pacientes() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [servicio, setServicio] = useState(servicios[0]);
  const [motivo, setMotivo] = useState('');
  const [fechas, setFechas] = useState([]);
  const [horaGeneral, setHoraGeneral] = useState('09:00:00');
  const [mesVisible, setMesVisible] = useState(() => {
    const fecha = new Date();
    return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  });
  const [fechaConsultando, setFechaConsultando] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const hoy = formatearFechaLocal();

  async function obtenerPacientes() {
    setCargando(true);

    const { data, error } = await supabase
      .from('pacientes')
      .select(`
        id,
        nombre_paciente,
        edad,
        nombre_responsable,
        telefono,
        correo,
        citas(id, fecha, hora, estatus)
      `)
      .order('nombre_paciente', { ascending: true });

    if (error) {
      console.error(error);
      setMensaje('No se pudo cargar la lista de pacientes.');
    } else {
      setPacientes(data || []);
    }

    setCargando(false);
  }

  useEffect(() => {
    obtenerPacientes();
  }, []);

  const pacientesFiltrados = pacientes.filter((paciente) => {
    const texto = [
      paciente.nombre_paciente,
      paciente.edad,
      paciente.nombre_responsable,
      paciente.telefono,
      paciente.correo
    ].join(' ').toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const citasFuturas = (paciente) => {
    return (paciente.citas || []).filter(
      (cita) => cita.fecha >= hoy && cita.estatus !== 'Cancelada'
    ).length;
  };

  const abrirProgramacion = (paciente) => {
    setPacienteSeleccionado(paciente);
    setServicio(servicios[0]);
    setMotivo('');
    setFechas([]);
    setHoraGeneral('09:00:00');
    const fecha = new Date();
    setMesVisible(new Date(fecha.getFullYear(), fecha.getMonth(), 1));
    setMensaje('');
    setModalAbierto(true);
  };

  const cambiarFecha = async (id, fecha) => {
    setFechas((actuales) =>
      actuales.map((item) =>
        item.id === id
          ? { ...item, fecha, hora: '', horarios: [], cargando: Boolean(fecha) }
          : item
      )
    );

    if (!fecha) return;

    const { data, error } = await supabase.rpc('obtener_horarios_disponibles', {
      fecha_consulta: fecha
    });

    setFechas((actuales) =>
      actuales.map((item) =>
        item.id === id
          ? {
              ...item,
              horarios: error ? [] : (data || []).filter((hora) => hora.disponible),
              cargando: false
            }
          : item
      )
    );
  };

  const seleccionarDia = async (fecha) => {
    const existente = fechas.find((item) => item.fecha === fecha);

    if (existente) {
      setFechas((actuales) => actuales.filter((item) => item.id !== existente.id));
      return;
    }

    setFechaConsultando(fecha);
    setMensaje('');

    const { data, error } = await supabase.rpc('obtener_horarios_disponibles', {
      fecha_consulta: fecha
    });

    setFechaConsultando('');

    if (error) {
      setMensaje('No se pudo consultar la disponibilidad de ese día.');
      return;
    }

    const disponibles = (data || []).filter((item) => item.disponible);
    const horaDisponible = disponibles.some(
      (item) => item.hora_disponible === horaGeneral
    );

    if (!horaDisponible) {
      setMensaje(
        `La hora ${horaGeneral.slice(0, 5)} ya está ocupada el ${fecha}. Elige otra hora o ajusta ese día manualmente.`
      );
      return;
    }

    setFechas((actuales) => [
      ...actuales,
      crearCitaSeleccionada(fecha, horaGeneral, disponibles)
    ].sort((a, b) => a.fecha.localeCompare(b.fecha)));
  };

  const actualizarHora = (id, hora) => {
    setFechas((actuales) =>
      actuales.map((item) => (item.id === id ? { ...item, hora } : item))
    );
  };

  const quitarFecha = (id) => {
    setFechas((actuales) => actuales.filter((item) => item.id !== id));
  };

  const cambiarHoraGeneral = (hora) => {
    setHoraGeneral(hora);
    setFechas([]);
    setMensaje('');
  };

  const cambiarMes = (cantidad) => {
    setMesVisible(
      (actual) => new Date(actual.getFullYear(), actual.getMonth() + cantidad, 1)
    );
  };

  const diasCalendario = () => {
    const year = mesVisible.getFullYear();
    const month = mesVisible.getMonth();
    const primerDia = new Date(year, month, 1).getDay();
    const totalDias = new Date(year, month + 1, 0).getDate();
    const celdas = Array.from({ length: primerDia }, () => null);

    for (let day = 1; day <= totalDias; day += 1) {
      celdas.push({
        numero: day,
        fecha: crearFechaLocal(year, month, day),
        domingo: new Date(year, month, day).getDay() === 0
      });
    }

    return celdas;
  };

  const programarCitas = async (event) => {
    event.preventDefault();
    setMensaje('');

    if (fechas.length === 0) {
      setMensaje('Selecciona al menos un día en el calendario.');
      return;
    }

    if (fechas.some((item) => !item.fecha || !item.hora)) {
      setMensaje('Selecciona la fecha y hora de cada cita.');
      return;
    }

    const repetidas = new Set(
      fechas.map((item) => `${item.fecha}-${item.hora}`)
    );

    if (repetidas.size !== fechas.length) {
      setMensaje('Hay fechas y horas repetidas en la programación.');
      return;
    }

    setGuardando(true);

    const { error } = await supabase.rpc('programar_citas_paciente', {
      p_paciente_id: pacienteSeleccionado.id,
      p_servicio: servicio,
      p_motivo_consulta: motivo.trim() || null,
      p_citas: fechas.map(({ fecha, hora }) => ({ fecha, hora }))
    });

    setGuardando(false);

    if (error) {
      setMensaje(error.message || 'No se pudieron programar las citas.');
      return;
    }

    setModalAbierto(false);
    await obtenerPacientes();
  };

  const eliminarPaciente = async (paciente) => {
    const confirmado = window.confirm(
      `¿Eliminar a ${paciente.nombre_paciente}? Se borrarán sus citas, sesiones, pagos y firmas. Esta acción no se puede deshacer.`
    );

    if (!confirmado) return;

    const { error } = await supabase.rpc('eliminar_paciente_admin', {
      p_paciente_id: paciente.id
    });

    if (error) {
      setMensaje(error.message || 'No se pudo eliminar al paciente.');
      return;
    }

    setMensaje('El registro del paciente fue eliminado.');
    await obtenerPacientes();
  };

  return (
    <main className="container patients-page">
      <header className="patients-heading">
        <div>
          <span className="patients-eyebrow">Administración clínica</span>
          <h1>Pacientes</h1>
          <p className="subtitle">
            Consulta expedientes, programa próximas terapias o elimina registros.
          </p>
        </div>
        <span className="patients-total">
          <strong>{pacientesFiltrados.length}</strong>
          pacientes
        </span>
      </header>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Buscar por paciente, responsable, teléfono o correo..."
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
        />
      </div>

      {mensaje && <p className="admin-message">{mensaje}</p>}

      <div className="table-container patients-table-container">
        <table className="patients-table">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Responsable</th>
              <th>Contacto</th>
              <th>Próximas citas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pacientesFiltrados.map((paciente) => (
              <tr key={paciente.id}>
                <td data-label="Paciente">
                  <strong>{paciente.nombre_paciente}</strong>
                  <small className="table-detail">
                    {paciente.edad !== null ? `${paciente.edad} años` : 'Edad no registrada'}
                  </small>
                </td>
                <td data-label="Responsable">
                  {paciente.nombre_responsable || 'No registrado'}
                </td>
                <td data-label="Contacto">
                  {paciente.telefono}
                  <small className="table-detail">{paciente.correo || 'Sin correo'}</small>
                </td>
                <td data-label="Próximas citas">
                  <div className="appointment-summary">
                    <span className="appointment-count">{citasFuturas(paciente)}</span>
                    <span>programadas</span>
                  </div>
                </td>
                <td data-label="Acciones">
                  <div className="acciones patient-actions">
                    <button
                      type="button"
                      className="patient-action patient-action-primary"
                      onClick={() => abrirProgramacion(paciente)}
                    >
                      <span className="patient-action-icon" aria-hidden="true">+</span>
                      <span>Programar citas</span>
                    </button>
                    <button
                      type="button"
                      className="patient-action patient-action-secondary"
                      onClick={() => navigate(`/admin/expediente/${paciente.id}`)}
                    >
                      <span className="patient-action-icon" aria-hidden="true">□</span>
                      <span>Expediente</span>
                    </button>
                    <button
                      type="button"
                      className="patient-action patient-action-danger"
                      onClick={() => eliminarPaciente(paciente)}
                    >
                      <span className="patient-action-icon" aria-hidden="true">×</span>
                      <span>Eliminar</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!cargando && pacientesFiltrados.length === 0 && (
        <p className="empty">No se encontraron pacientes.</p>
      )}

      <Modal
        isOpen={modalAbierto}
        onRequestClose={() => !guardando && setModalAbierto(false)}
        className="modal-cita modal-programacion"
        overlayClassName="overlay-cita"
      >
        <div className="modal-cita-header">
          <div>
            <span className="modal-eyebrow">Programación de terapias</span>
            <h2>{pacienteSeleccionado?.nombre_paciente}</h2>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={() => setModalAbierto(false)}
            disabled={guardando}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form className="schedule-form" onSubmit={programarCitas}>
          <label>
            Servicio
            <select value={servicio} onChange={(event) => setServicio(event.target.value)}>
              {servicios.map((opcion) => (
                <option key={opcion} value={opcion}>{opcion}</option>
              ))}
            </select>
          </label>

          <label>
            Acuerdo u observaciones
            <textarea
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Ej. Terapia semanal durante cuatro semanas"
            />
          </label>

          <div className="bulk-schedule-controls">
            <label>
              Hora para todas las citas
              <select
                value={horaGeneral}
                onChange={(event) => cambiarHoraGeneral(event.target.value)}
              >
                {horasGenerales.map((hora) => (
                  <option key={hora} value={hora}>{hora.slice(0, 5)}</option>
                ))}
              </select>
            </label>
            <p>
              Marca todos los días acordados. Sólo se agregarán cuando esta hora
              siga disponible.
            </p>
          </div>

          <section className="multi-date-calendar" aria-label="Calendario para seleccionar citas">
            <header>
              <button
                type="button"
                className="calendar-month-button"
                onClick={() => cambiarMes(-1)}
                aria-label="Mes anterior"
              >
                ‹
              </button>
              <strong>
                {nombresMes[mesVisible.getMonth()]} {mesVisible.getFullYear()}
              </strong>
              <button
                type="button"
                className="calendar-month-button"
                onClick={() => cambiarMes(1)}
                aria-label="Mes siguiente"
              >
                ›
              </button>
            </header>

            <div className="calendar-weekdays" aria-hidden="true">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => (
                <span key={dia}>{dia}</span>
              ))}
            </div>

            <div className="calendar-days">
              {diasCalendario().map((dia, index) => {
                if (!dia) {
                  return <span className="calendar-empty" key={`empty-${index}`} />;
                }

                const seleccionado = fechas.some((item) => item.fecha === dia.fecha);
                const deshabilitado = dia.fecha < hoy || dia.domingo;
                const consultando = fechaConsultando === dia.fecha;

                return (
                  <button
                    type="button"
                    key={dia.fecha}
                    className={seleccionado ? 'selected' : ''}
                    disabled={deshabilitado || Boolean(fechaConsultando)}
                    onClick={() => seleccionarDia(dia.fecha)}
                    aria-pressed={seleccionado}
                    title={dia.domingo ? 'No se atiende los domingos' : ''}
                  >
                    {consultando ? '…' : dia.numero}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="schedule-summary">
            <div>
              <strong>{fechas.length} cita{fechas.length === 1 ? '' : 's'} seleccionada{fechas.length === 1 ? '' : 's'}</strong>
              <span>Puedes cambiar individualmente cualquier fecha u hora.</span>
            </div>
          </div>

          <div className="schedule-list">
            {fechas.map((item, index) => (
              <div className="schedule-row" key={item.id}>
                <span className="schedule-number">{index + 1}</span>
                <input
                  type="date"
                  min={hoy}
                  value={item.fecha}
                  onChange={(event) => cambiarFecha(item.id, event.target.value)}
                  required
                />
                <select
                  value={item.hora}
                  onChange={(event) => actualizarHora(item.id, event.target.value)}
                  disabled={!item.fecha || item.cargando}
                  required
                >
                  <option value="">
                    {item.cargando ? 'Consultando...' : 'Selecciona una hora'}
                  </option>
                  {item.horarios.map((horario) => (
                    <option
                      key={horario.hora_disponible}
                      value={horario.hora_disponible}
                    >
                      {horario.hora_disponible.slice(0, 5)}
                    </option>
                  ))}
                </select>
                {fechas.length > 1 && (
                  <button
                    type="button"
                    className="schedule-remove"
                    onClick={() => quitarFecha(item.id)}
                    aria-label="Quitar fecha"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {mensaje && <p className="error">{mensaje}</p>}

          <div className="modal-actions">
            <button type="submit" disabled={guardando}>
              {guardando ? 'Programando...' : `Programar ${fechas.length} cita${fechas.length > 1 ? 's' : ''}`}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}

export default Pacientes;
