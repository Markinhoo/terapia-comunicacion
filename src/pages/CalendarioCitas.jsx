import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

function CalendarioCitas() {
  const [eventos, setEventos] = useState([]);

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
    </main>
  );
}

export default CalendarioCitas;