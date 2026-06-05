import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function ExpedienteClinico() {
 const { pacienteId } = useParams();
  const navigate = useNavigate();

  const [cita, setCita] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [form, setForm] = useState({
    diagnostico: '',
    evolucion: '',
    recomendaciones: '',
    tareas_casa: ''
  });

useEffect(() => {
  obtenerPaciente();
  obtenerExpedientes();
}, []);

  const obtenerPaciente = async () => {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', pacienteId)
    .single();

  if (!error) {
    setCita(data);
  }
};
  const obtenerExpedientes = async () => {
  const { data, error } = await supabase
    .from('expedientes')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('fecha', { ascending: false });

  if (!error) {
    setExpedientes(data);
  }
};

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const guardarExpediente = async (e) => {
    e.preventDefault();

    const nuevoExpediente = {
  paciente_id: Number(pacienteId),
  fecha: new Date().toISOString().split('T')[0],
  diagnostico: form.diagnostico,
  evolucion: form.evolucion,
  recomendaciones: form.recomendaciones,
  tareas_casa: form.tareas_casa
};

    const { error } = await supabase
      .from('expedientes')
      .insert([nuevoExpediente]);

    if (!error) {
      setForm({
        diagnostico: '',
        evolucion: '',
        recomendaciones: '',
        tareas_casa: ''
      });

      obtenerExpedientes();
    } else {
      console.error(error);
      alert('No se pudo guardar el expediente.');
    }
  };

  return (
    <main className="container">
      <button onClick={() => navigate('/admin')}>Regresar</button>

      <h1>Expediente clínico</h1>

      {cita && (
        <section className="info-section">
          <h2>{cita.nombre_paciente}</h2>
          <p><strong>Edad:</strong> {cita.edad}</p>
          <p><strong>Responsable:</strong> {cita.nombre_responsable}</p>
          <p><strong>Teléfono:</strong> {cita.telefono}</p>
          <p><strong>Servicio:</strong> {cita.servicio}</p>
          <p><strong>Motivo de consulta:</strong> {cita.motivo_consulta}</p>
        </section>
      )}

      <section className="form-section">
        <h2>Nueva nota clínica</h2>

        <form className="form" onSubmit={guardarExpediente}>
          <textarea
            name="diagnostico"
            placeholder="Diagnóstico o impresión clínica"
            value={form.diagnostico}
            onChange={handleChange}
            required
          />

          <textarea
            name="evolucion"
            placeholder="Evolución de la sesión"
            value={form.evolucion}
            onChange={handleChange}
            required
          />

          <textarea
            name="recomendaciones"
            placeholder="Recomendaciones"
            value={form.recomendaciones}
            onChange={handleChange}
          />

          <textarea
            name="tareas_casa"
            placeholder="Tareas para casa"
            value={form.tareas_casa}
            onChange={handleChange}
          />

          <button type="submit">Guardar nota clínica</button>
        </form>
      </section>

      <section>
        <h2>Historial clínico</h2>

        {expedientes.length === 0 && (
          <p className="empty">No hay notas clínicas registradas.</p>
        )}

        {expedientes.map((exp) => (
          <div className="expediente-card" key={exp.id}>
            <h3>Fecha: {exp.fecha}</h3>
            <p><strong>Diagnóstico:</strong> {exp.diagnostico}</p>
            <p><strong>Evolución:</strong> {exp.evolucion}</p>
            <p><strong>Recomendaciones:</strong> {exp.recomendaciones}</p>
            <p><strong>Tareas en casa:</strong> {exp.tareas_casa}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

export default ExpedienteClinico;