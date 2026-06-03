import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

function PanelAdmin() {
  const [citas, setCitas] = useState([]);
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

  return (
    <main className="container">
      <div className="admin-header">
        <h1>Citas agendadas</h1>
        <button onClick={cerrarSesion}>Cerrar sesión</button>
      </div>

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
          </tr>
        </thead>

        <tbody>
          {citas.map((cita) => (
            <tr key={cita.id}>
              <td>{cita.nombre_paciente}</td>
              <td>{cita.edad}</td>
              <td>{cita.nombre_responsable}</td>
              <td>{cita.telefono}</td>
              <td>{cita.servicio}</td>
              <td>{cita.modalidad}</td>
              <td>{cita.fecha}</td>
              <td>{cita.hora}</td>
              <td>{cita.estatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

export default PanelAdmin;