import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function ExpedienteClinico() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState(null);
  const [expedientes, setExpedientes] = useState([]);

  const [detalle, setDetalle] = useState({
    fecha_nacimiento: '',
    sexo: '',
    antecedentes_perinatales: '',
    antecedentes_medicos: '',
    antecedentes_familiares: '',
    lenguaje_receptivo: '',
    lenguaje_expresivo: '',
    articulacion: '',
    diagnostico_inicial: ''
  });

  const [form, setForm] = useState({
    diagnostico: '',
    evolucion: '',
    recomendaciones: '',
    tareas_casa: ''
  });

  useEffect(() => {
    obtenerPaciente();
    obtenerDetallePaciente();
    obtenerExpedientes();
  }, []);

  const obtenerPaciente = async () => {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', pacienteId)
      .single();

    if (!error) {
      setPaciente(data);
    } else {
      console.error(error);
    }
  };

  const obtenerDetallePaciente = async () => {
    const { data, error } = await supabase
      .from('paciente_detalle')
      .select('*')
      .eq('paciente_id', pacienteId)
      .maybeSingle();

    if (!error && data) {
      setDetalle({
        fecha_nacimiento: data.fecha_nacimiento || '',
        sexo: data.sexo || '',
        antecedentes_perinatales: data.antecedentes_perinatales || '',
        antecedentes_medicos: data.antecedentes_medicos || '',
        antecedentes_familiares: data.antecedentes_familiares || '',
        lenguaje_receptivo: data.lenguaje_receptivo || '',
        lenguaje_expresivo: data.lenguaje_expresivo || '',
        articulacion: data.articulacion || '',
        diagnostico_inicial: data.diagnostico_inicial || ''
      });
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
    } else {
      console.error(error);
    }
  };

  const handleDetalleChange = (e) => {
    setDetalle({
      ...detalle,
      [e.target.name]: e.target.value
    });
  };

  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const guardarFichaClinica = async () => {
    const registro = {
      paciente_id: Number(pacienteId),
      ...detalle
    };

    const { data: existente, error: errorConsulta } = await supabase
      .from('paciente_detalle')
      .select('id')
      .eq('paciente_id', pacienteId)
      .maybeSingle();

    if (errorConsulta) {
      alert('No se pudo consultar la ficha clínica.');
      console.error(errorConsulta);
      return;
    }

    if (existente) {
      const { error } = await supabase
        .from('paciente_detalle')
        .update(registro)
        .eq('paciente_id', pacienteId);

      if (error) {
        alert('No se pudo actualizar la ficha clínica.');
        console.error(error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('paciente_detalle')
        .insert([registro]);

      if (error) {
        alert('No se pudo guardar la ficha clínica.');
        console.error(error);
        return;
      }
    }

    alert('Ficha clínica guardada correctamente.');
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

    if (error) {
      alert('No se pudo guardar la nota clínica.');
      console.error(error);
      return;
    }

    setForm({
      diagnostico: '',
      evolucion: '',
      recomendaciones: '',
      tareas_casa: ''
    });

    obtenerExpedientes();
  };

  return (
    <main className="container">
      <button onClick={() => navigate('/admin')}>
        Regresar al panel
      </button>

      <h1>Expediente clínico</h1>

      {paciente && (
        <section className="info-section">
          <h2>{paciente.nombre_paciente}</h2>
          <p><strong>Edad:</strong> {paciente.edad}</p>
          <p><strong>Responsable:</strong> {paciente.nombre_responsable}</p>
          <p><strong>Teléfono:</strong> {paciente.telefono}</p>
          <p><strong>Correo:</strong> {paciente.correo}</p>
        </section>
      )}

      <section className="expediente-card">
        <h2>Ficha clínica</h2>

        <input
          type="date"
          name="fecha_nacimiento"
          value={detalle.fecha_nacimiento}
          onChange={handleDetalleChange}
        />

        <select
          name="sexo"
          value={detalle.sexo}
          onChange={handleDetalleChange}
        >
          <option value="">Sexo</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
        </select>

        <textarea
          name="antecedentes_perinatales"
          placeholder="Antecedentes perinatales"
          value={detalle.antecedentes_perinatales}
          onChange={handleDetalleChange}
        />

        <textarea
          name="antecedentes_medicos"
          placeholder="Antecedentes médicos"
          value={detalle.antecedentes_medicos}
          onChange={handleDetalleChange}
        />

        <textarea
          name="antecedentes_familiares"
          placeholder="Antecedentes familiares"
          value={detalle.antecedentes_familiares}
          onChange={handleDetalleChange}
        />

        <textarea
          name="lenguaje_receptivo"
          placeholder="Lenguaje receptivo"
          value={detalle.lenguaje_receptivo}
          onChange={handleDetalleChange}
        />

        <textarea
          name="lenguaje_expresivo"
          placeholder="Lenguaje expresivo"
          value={detalle.lenguaje_expresivo}
          onChange={handleDetalleChange}
        />

        <textarea
          name="articulacion"
          placeholder="Articulación"
          value={detalle.articulacion}
          onChange={handleDetalleChange}
        />

        <textarea
          name="diagnostico_inicial"
          placeholder="Diagnóstico inicial"
          value={detalle.diagnostico_inicial}
          onChange={handleDetalleChange}
        />

        <button type="button" onClick={guardarFichaClinica}>
          Guardar ficha clínica
        </button>
      </section>

      <section className="form-section">
        <h2>Nueva nota clínica</h2>

        <form className="form" onSubmit={guardarExpediente}>
          <textarea
            name="diagnostico"
            placeholder="Diagnóstico o impresión clínica"
            value={form.diagnostico}
            onChange={handleFormChange}
            required
          />

          <textarea
            name="evolucion"
            placeholder="Evolución de la sesión"
            value={form.evolucion}
            onChange={handleFormChange}
            required
          />

          <textarea
            name="recomendaciones"
            placeholder="Recomendaciones"
            value={form.recomendaciones}
            onChange={handleFormChange}
          />

          <textarea
            name="tareas_casa"
            placeholder="Tareas para casa"
            value={form.tareas_casa}
            onChange={handleFormChange}
          />

          <button type="submit">
            Guardar nota clínica
          </button>
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