import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { supabase } from '../lib/supabaseClient';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import {
  citaVisibleEnAgenda,
  estadoCitaActual,
  obtenerRangoCita,
  sincronizarCitasEnCurso
} from '../utils/citas';
import 'react-big-calendar/lib/css/react-big-calendar.css';

Modal.setAppElement('#root');

moment.locale('es');
const localizer = momentLocalizer(moment);
const formatearCalendario = (date, options) => (
  new Intl.DateTimeFormat('es-MX', options).format(date)
);
const formatosCalendario = {
  monthHeaderFormat: (date) => formatearCalendario(date, {
    month: 'long',
    year: 'numeric'
  }),
  dayHeaderFormat: (date) => formatearCalendario(date, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }),
  dayRangeHeaderFormat: ({ start, end }) => (
    `${formatearCalendario(start, { day: 'numeric', month: 'long' })} - ${
      formatearCalendario(end, { day: 'numeric', month: 'long', year: 'numeric' })
    }`
  ),
  agendaHeaderFormat: ({ start, end }) => (
    `${formatearCalendario(start, { day: 'numeric', month: 'long' })} - ${
      formatearCalendario(end, { day: 'numeric', month: 'long', year: 'numeric' })
    }`
  ),
  agendaDateFormat: (date) => formatearCalendario(date, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }),
  agendaTimeFormat: (date) => formatearCalendario(date, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
};

function CalendarioCitas() {
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [vistaMovil, setVistaMovil] = useState(() => window.innerWidth <= 768);
  const { toast, mostrarToast, cerrarToast } = useToast();

  useEffect(() => {
    obtenerCitas();
  }, []);

  useEffect(() => {
    const actualizarVista = () => setVistaMovil(window.innerWidth <= 768);
    window.addEventListener('resize', actualizarVista);

    return () => window.removeEventListener('resize', actualizarVista);
  }, []);

  async function obtenerCitas() {
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    const ahora = new Date();
    await sincronizarCitasEnCurso(supabase, data || [], ahora);

    setCitas((data || []).map((cita) => ({
      ...cita,
      estatus: estadoCitaActual(cita, ahora)
    })));
  }

  const normalizarTexto = (valor = '') => (
    String(valor)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  );

  const crearEvento = (cita) => {
    const { inicio, fin } = obtenerRangoCita(cita);

    return {
      title: `${cita.nombre_paciente} - ${cita.servicio}`,
      start: inicio,
      end: fin,
      estatus: cita.estatus,
      cita
    };
  };

  const citasFiltradas = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    if (!texto) return citas;

    const coincide = (cita) => normalizarTexto([
      cita.nombre_paciente,
      cita.nombre_responsable,
      cita.telefono,
      cita.correo,
      cita.servicio,
      cita.fecha
    ].filter(Boolean).join(' ')).includes(texto);

    const coincidencias = citas.filter(coincide);
    const pacientes = new Set(coincidencias.map((cita) => cita.paciente_id).filter(Boolean));
    const telefonos = new Set(coincidencias.map((cita) => cita.telefono).filter(Boolean));
    const correos = new Set(coincidencias.map((cita) => normalizarTexto(cita.correo)).filter(Boolean));
    const responsables = new Set(coincidencias.map((cita) => normalizarTexto(cita.nombre_responsable)).filter(Boolean));

    return citas.filter((cita) => (
      coincide(cita)
      || (cita.paciente_id && pacientes.has(cita.paciente_id))
      || (cita.telefono && telefonos.has(cita.telefono))
      || (cita.correo && correos.has(normalizarTexto(cita.correo)))
      || (cita.nombre_responsable && responsables.has(normalizarTexto(cita.nombre_responsable)))
    ));
  }, [busqueda, citas]);

  useEffect(() => {
    const ahora = new Date();
    const hayBusqueda = busqueda.trim().length > 0;
    const eventosCalendario = citasFiltradas
      .map((cita) => ({
        ...cita,
        estatus: estadoCitaActual(cita, ahora)
      }))
      .filter((cita) => hayBusqueda || citaVisibleEnAgenda(cita, ahora))
      .map(crearEvento);

    setEventos(eventosCalendario);
  }, [busqueda, citasFiltradas]);

  const estiloEvento = (event) => {
    let backgroundColor = '#f1c40f';

    if (event.estatus === 'Confirmada') {
      backgroundColor = '#27ae60';
    }

    if (event.estatus === 'Pendiente') {
      backgroundColor = '#f1c40f';
    }

    if (event.estatus === 'Cancelada') {
      backgroundColor = '#c0392b';
    }

    if (event.estatus === 'En curso') {
      backgroundColor = '#8e5ad7';
    }

    return {
      style: {
        backgroundColor,
        color: 'white',
        borderRadius: '8px',
        border: 'none',
        padding: '2px 6px',
        animation: event.estatus === 'En curso'
          ? 'cita-pulse 1.15s ease-in-out infinite'
          : undefined
      }
    };
  };

  const confirmarCita = async () => {
    if (!citaSeleccionada) return;

    const { error } = await supabase
      .from('citas')
      .update({
        estatus: 'Confirmada',
        confirmado: true,
        fecha_confirmacion: new Date().toISOString()
      })
      .eq('id', citaSeleccionada.id);

    if (error) {
      console.error(error);
      mostrarToast('No se pudo confirmar la cita.', 'error');
      return;
    }

    await obtenerCitas();
    setModalAbierto(false);
  };

  const cancelarCita = async () => {
    if (!citaSeleccionada) return;

    const confirmar = window.confirm('¿Deseas cancelar esta cita?');

    if (!confirmar) return;

    const { error } = await supabase
      .from('citas')
      .update({
        estatus: 'Cancelada',
        confirmado: false
      })
      .eq('id', citaSeleccionada.id);

    if (error) {
      console.error(error);
      mostrarToast('No se pudo cancelar la cita.', 'error');
      return;
    }

    await obtenerCitas();
    setModalAbierto(false);
  };

  const abrirExpediente = () => {
  if (!citaSeleccionada?.paciente_id) {
    mostrarToast('Esta cita no tiene paciente asociado.', 'error');
    return;
  }

  setModalAbierto(false);

  navigate(
    `/admin/expediente/${citaSeleccionada.paciente_id}`
  );
};

  const abrirWhatsApp = () => {
    if (!citaSeleccionada?.telefono) {
      mostrarToast('Esta cita no tiene telefono registrado.', 'error');
      return;
    }

    const telefono = citaSeleccionada.telefono.replace(/\D/g, '');

    const mensaje = encodeURIComponent(
      `Hola ${citaSeleccionada.nombre_paciente}, le contactamos de Clínica Casas para confirmar su cita.\n\nFecha: ${citaSeleccionada.fecha}\nHora: ${citaSeleccionada.hora?.slice(0, 5)}\nServicio: ${citaSeleccionada.servicio}\n\nGracias.`
    );

    window.open(`https://wa.me/52${telefono}?text=${mensaje}`, '_blank');
  };

  return (
    <main className="calendar-page">
      <div className="calendar-container">
        <section className="calendar-search-panel" aria-label="Busqueda de citas">
          <label>
            Buscar citas
            <input
              type="search"
              placeholder="Paciente, responsable, telefono, correo, servicio o fecha..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </label>

          {busqueda.trim() && (
            <div className="calendar-search-summary">
              <strong>{citasFiltradas.length}</strong>
              <span>
                cita{citasFiltradas.length === 1 ? '' : 's'} relacionada{citasFiltradas.length === 1 ? '' : 's'}
              </span>
              <button type="button" onClick={() => setBusqueda('')}>
                Limpiar
              </button>
            </div>
          )}
        </section>

        {busqueda.trim() && (
          <section className="calendar-search-results" aria-label="Resultados de busqueda">
            {citasFiltradas.length === 0 && (
              <p>No se encontraron citas con esa busqueda.</p>
            )}

            {citasFiltradas.slice(0, 8).map((cita) => (
              <button
                type="button"
                key={cita.id}
                className="calendar-result-card"
                onClick={() => {
                  setCitaSeleccionada(cita);
                  setModalAbierto(true);
                }}
              >
                <strong>{cita.nombre_paciente}</strong>
                <span>{cita.fecha} - {cita.hora?.slice(0, 5)} - {cita.estatus}</span>
                <small>{cita.nombre_responsable || 'Sin responsable'} - {cita.telefono || 'Sin telefono'}</small>
              </button>
            ))}
          </section>
        )}

        <Calendar
          key={vistaMovil ? 'agenda-movil' : 'calendario-escritorio'}
          localizer={localizer}
          culture="es"
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          defaultView={vistaMovil ? 'agenda' : 'month'}
          views={vistaMovil ? ['agenda', 'day'] : ['month', 'week', 'day', 'agenda']}
          formats={formatosCalendario}
          eventPropGetter={estiloEvento}
          onSelectEvent={(evento) => {
            setCitaSeleccionada(evento.cita);
            setModalAbierto(true);
          }}
          messages={{
            next: 'Siguiente',
            previous: 'Anterior',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Dia',
            agenda: 'Agenda',
            date: 'Fecha',
            time: 'Hora',
            event: 'Cita',
            noEventsInRange: 'No hay citas en este periodo.'
          }}
        />

        <div className="calendar-legend">
          <span className="legend-item confirmada">Confirmada</span>
          <span className="legend-item en-curso">En curso</span>
          <span className="legend-item pendiente">Pendiente</span>
          <span className="legend-item cancelada">Cancelada</span>
        </div>
      </div>

      <Modal
        isOpen={modalAbierto}
        onRequestClose={() => setModalAbierto(false)}
        className="modal-cita"
        overlayClassName="overlay-cita"
      >
        {citaSeleccionada && (
          <>
            <div className="modal-cita-header">
              <h2>{citaSeleccionada.nombre_paciente}</h2>

              <button
                type="button"
                className="modal-close"
                onClick={() => setModalAbierto(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-cita-body">
              <p>
                <strong>Servicio:</strong> {citaSeleccionada.servicio}
              </p>

              <p>
                <strong>Fecha:</strong> {citaSeleccionada.fecha}
              </p>

              <p>
                <strong>Hora:</strong> {citaSeleccionada.hora?.slice(0, 5)}
              </p>

              <p>
                <strong>Teléfono:</strong> {citaSeleccionada.telefono}
              </p>

              <p>
                <strong>Responsable:</strong>{' '}
                {citaSeleccionada.nombre_responsable || 'No registrado'}
              </p>

              <p>
                <strong>Correo:</strong> {citaSeleccionada.correo || 'No registrado'}
              </p>

              <p>
                <strong>Estatus:</strong>{' '}
                <span className={`badge ${citaSeleccionada.estatus?.toLowerCase()}`}>
                  {citaSeleccionada.estatus}
                </span>
              </p>

              <p>
                <strong>Motivo:</strong>{' '}
                {citaSeleccionada.motivo_consulta || 'Sin motivo registrado'}
              </p>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={confirmarCita}>
                Confirmar
              </button>

              <button
                type="button"
                className="btn-danger"
                onClick={cancelarCita}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={abrirExpediente}
              >
                Expediente
              </button>

              <button
                type="button"
                className="btn-whatsapp"
                onClick={abrirWhatsApp}
              >
                WhatsApp
              </button>
            </div>
          </>
        )}
      </Modal>

      <Toast toast={toast} onClose={cerrarToast} />
    </main>
  );
}

export default CalendarioCitas;
