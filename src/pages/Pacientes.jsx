import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function Pacientes() {
  const [citas, setCitas] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    obtenerCitas();
  }, []);

  const obtenerCitas = async () => {
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .order('fecha', { ascending: false });

    if (!error) {
      setCitas(data);
    } else {
      console.error(error);
    }
  };

  const pacientesFiltrados = citas.filter((cita) => {
    const texto = `
      ${cita.nombre_paciente || ''}
      ${cita.edad || ''}
      ${cita.nombre_responsable || ''}
      ${cita.telefono || ''}
      ${cita.correo || ''}
      ${cita.servicio || ''}
      ${cita.fecha || ''}
      ${cita.estatus || ''}
    `.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <main className="container">
      <h1>Pacientes / Citas registradas</h1>
      <p className="subtitle">
        Listado completo de registros capturados desde la agenda.
      </p>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Buscar paciente, responsable, teléfono, correo, servicio o fecha..."
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
              <th>Correo</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Estatus</th>
            </tr>
          </thead>

          <tbody>
            {pacientesFiltrados.map((cita) => (
              <tr key={cita.id}>
                <td>{cita.nombre_paciente}</td>
                <td>{cita.edad}</td>
                <td>{cita.nombre_responsable}</td>
                <td>{cita.telefono}</td>
                <td>{cita.correo}</td>
                <td>{cita.servicio}</td>
                <td>{cita.fecha}</td>
                <td>{cita.hora}</td>
                <td>
                  <span className={`badge ${cita.estatus?.toLowerCase()}`}>
                    {cita.estatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pacientesFiltrados.length === 0 && (
        <p className="empty">No se encontraron registros.</p>
      )}
    </main>
  );
}

export default Pacientes;