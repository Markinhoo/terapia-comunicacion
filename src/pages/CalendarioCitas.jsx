import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { supabase } from '../lib/supabaseClient';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

Modal.setAppElement('#root');

const localizer = momentLocalizer(moment);

function CalendarioCitas() {
  const navigate = useNavigate();

  const [eventos, setEventos] = useState([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    obtenerCitas();
  }, []);

  const obtenerCitas = async () => {
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    const eventosCalendario = data.map((cita) => {
      const inicio = new Date(`${cita.fecha}T${cita.hora}`);
      const fin = new Date(inicio);
      fin.setMinutes(fin.getMinutes() + 60);

      return {
        title: `${cita.nombre_paciente} - ${cita.servicio}`,
        start: inicio,
        end: fin,
        estatus: cita.estatus,
        cita
      };
    });

    setEventos(eventosCalendario);
  };

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

    return {
      style: {
        backgroundColor,
        color: 'white',
        borderRadius: '8px',
        border: 'none',
        padding: '2px 6px'
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
      alert('No se pudo confirmar la cita.');
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
      alert('No se pudo cancelar la cita.');
      return;
    }

    await obtenerCitas();
    setModalAbierto(false);
  };

  const abrirExpediente = () => {
  if (!citaSeleccionada?.paciente_id) {
    alert('Esta cita no tiene paciente asociado.');
    return;
  }

  setModalAbierto(false);

  navigate(
    `/expediente/${citaSeleccionada.paciente_id}`
  );
};

  const abrirWhatsApp = () => {
    if (!citaSeleccionada?.telefono) {
      alert('Esta cita no tiene teléfono registrado.');
      return;
    }

    const telefono = citaSeleccionada.telefono.replace(/\D/g, '');

    const mensaje = encodeURIComponent(
      `Hola ${citaSeleccionada.nombre_paciente}, le contactamos de Clínica Casas para confirmar su cita.\n\nFecha: ${citaSeleccionada.fecha}\nHora: ${citaSeleccionada.hora?.slice(0, 5)}\nServicio: ${citaSeleccionada.servicio}\n\nGracias.`
    );

    window.open(`https://wa.me/52${telefono}?text=${mensaje}`, '_blank');
  };

  return (
    <main>
      <div className="calendar-header">
        <div className="calendar-legend">
          <span className="legend-item confirmada">Confirmada</span>
          <span className="legend-item pendiente">Pendiente</span>
          <span className="legend-item cancelada">Cancelada</span>
        </div>
      </div>

      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={estiloEvento}
          onSelectEvent={(evento) => {
            setCitaSeleccionada(evento.cita);
            setModalAbierto(true);
          }}
          style={{ height: 'calc(100vh - 150px)' }}
          messages={{
            next: 'Siguiente',
            previous: 'Anterior',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda'
          }}
        />
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
    </main>
  );
}

export default CalendarioCitas;