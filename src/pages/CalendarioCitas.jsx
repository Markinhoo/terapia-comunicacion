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
      .neq('estatus', 'Cancelada');

    if (!error) {
      const eventosCalendario = data.map((cita) => {
        const inicio = new Date(`${cita.fecha}T${cita.hora}`);
        const fin = new Date(inicio);
        fin.setMinutes(fin.getMinutes() + 60);

        return {
          title: `${cita.nombre_paciente} - ${cita.servicio}`,
          start: inicio,
          end: fin,
          cita
        };
      });

      setEventos(eventosCalendario);
    }
  };

  return (
    <main className="container">
      <h1>Calendario de citas</h1>
      <p className="subtitle">Vista general de citas confirmadas y pendientes.</p>

      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
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