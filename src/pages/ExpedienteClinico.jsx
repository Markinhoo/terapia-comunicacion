import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { generarPDF } from '../utils/generarPDF';

function ExpedienteClinico() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [objetivos, setObjetivos] = useState([]);
  const [objetivosPaciente, setObjetivosPaciente] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [archivosPaciente, setArchivosPaciente] = useState([]);

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
    objetivo_trabajado: '',
    porcentaje_avance: 0,
    evolucion: '',
    recomendaciones: '',
    tareas_casa: ''
  });

  useEffect(() => {
    obtenerPaciente();
    obtenerDetallePaciente();
    obtenerExpedientes();
    obtenerObjetivos();
    obtenerObjetivosPaciente();
    obtenerArchivosPaciente();
  }, []);

  const obtenerPaciente = async () => {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', pacienteId)
      .single();

    if (!error) setPaciente(data);
    else console.error(error);
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

    if (!error) setExpedientes(data);
    else console.error(error);
  };

  const obtenerObjetivos = async () => {
    const { data, error } = await supabase
      .from('objetivos_terapeuticos')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (!error) setObjetivos(data);
    else console.error(error);
  };

  const obtenerObjetivosPaciente = async () => {
    const { data, error } = await supabase
      .from('paciente_objetivos')
      .select(`
        *,
        objetivos_terapeuticos (
          id,
          nombre,
          descripcion
        )
      `)
      .eq('paciente_id', pacienteId);

    if (!error) setObjetivosPaciente(data);
    else console.error(error);
  };

  const obtenerArchivosPaciente = async () => {
    const { data, error } = await supabase
      .from('archivos_paciente')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha_subida', { ascending: false });

    if (!error) setArchivosPaciente(data);
    else console.error(error);
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

  const agregarObjetivoPaciente = async (objetivoId) => {
    if (!objetivoId) return;

    const yaExiste = objetivosPaciente.some(
      (obj) => String(obj.objetivo_id) === String(objetivoId)
    );

    if (yaExiste) {
      alert('Este objetivo ya está asignado al paciente.');
      return;
    }

    const { error } = await supabase
      .from('paciente_objetivos')
      .insert([
        {
          paciente_id: Number(pacienteId),
          objetivo_id: Number(objetivoId),
          porcentaje_avance: 0
        }
      ]);

    if (!error) obtenerObjetivosPaciente();
    else {
      alert('No se pudo asignar el objetivo.');
      console.error(error);
    }
  };

  const actualizarAvanceObjetivo = async (objetivoNombre, porcentaje) => {
    const objetivoPaciente = objetivosPaciente.find(
      (obj) => obj.objetivos_terapeuticos?.nombre === objetivoNombre
    );

    if (!objetivoPaciente) return;

    await supabase
      .from('paciente_objetivos')
      .update({
        porcentaje_avance: Number(porcentaje)
      })
      .eq('id', objetivoPaciente.id);

    obtenerObjetivosPaciente();
  };

  const guardarExpediente = async (e) => {
    e.preventDefault();

    const nuevoExpediente = {
      paciente_id: Number(pacienteId),
      fecha: new Date().toISOString().split('T')[0],
      diagnostico: form.diagnostico,
      objetivo_trabajado: form.objetivo_trabajado,
      porcentaje_avance: Number(form.porcentaje_avance),
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

    if (form.objetivo_trabajado) {
      await actualizarAvanceObjetivo(
        form.objetivo_trabajado,
        form.porcentaje_avance
      );
    }

    setForm({
      diagnostico: '',
      objetivo_trabajado: '',
      porcentaje_avance: 0,
      evolucion: '',
      recomendaciones: '',
      tareas_casa: ''
    });

    obtenerExpedientes();
  };

  const subirArchivo = async () => {
    if (!archivo) {
      alert('Selecciona un archivo.');
      return;
    }

    const ruta = `${pacienteId}/${Date.now()}_${archivo.name}`;

    const { error: errorUpload } = await supabase.storage
      .from('expedientes')
      .upload(ruta, archivo);

    if (errorUpload) {
      alert('No se pudo subir el archivo.');
      console.error(errorUpload);
      return;
    }

    const { error: errorBD } = await supabase
      .from('archivos_paciente')
      .insert([
        {
          paciente_id: Number(pacienteId),
          nombre_archivo: archivo.name,
          ruta_archivo: ruta,
          tipo_archivo: archivo.type
        }
      ]);

    if (errorBD) {
      alert('El archivo se subió, pero no se pudo guardar el registro.');
      console.error(errorBD);
      return;
    }

    setArchivo(null);
    obtenerArchivosPaciente();
    alert('Archivo subido correctamente.');
  };

  const abrirArchivo = async (ruta) => {
    const { data, error } = await supabase.storage
      .from('expedientes')
      .createSignedUrl(ruta, 60);

    if (error) {
      alert('No se pudo abrir el archivo.');
      console.error(error);
      return;
    }

    window.open(data.signedUrl, '_blank');
  };

  const eliminarArchivo = async (archivoPaciente) => {
    const confirmar = window.confirm('¿Deseas eliminar este archivo?');

    if (!confirmar) return;

    const { error: errorStorage } = await supabase.storage
      .from('expedientes')
      .remove([archivoPaciente.ruta_archivo]);

    if (errorStorage) {
      alert('No se pudo eliminar el archivo del almacenamiento.');
      console.error(errorStorage);
      return;
    }

    const { error: errorBD } = await supabase
      .from('archivos_paciente')
      .delete()
      .eq('id', archivoPaciente.id);

    if (errorBD) {
      alert('No se pudo eliminar el registro.');
      console.error(errorBD);
      return;
    }

    obtenerArchivosPaciente();
  };

  return (
    <main className="container">
      <button onClick={() => navigate('/admin')}>
        Regresar al panel
      </button>

      <h1>Expediente clínico</h1>

      {paciente && (
        <button
          type="button"
          onClick={() => generarPDF(paciente, detalle, expedientes)}
        >
          Generar PDF
        </button>
      )}

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

      <section className="expediente-card">
        <h2>Plan terapéutico</h2>

        <select
          onChange={(e) => agregarObjetivoPaciente(e.target.value)}
          defaultValue=""
        >
          <option value="">Seleccionar objetivo terapéutico</option>

          {objetivos.map((obj) => (
            <option key={obj.id} value={obj.id}>
              {obj.nombre}
            </option>
          ))}
        </select>

        <div className="objetivos-grid">
          {objetivosPaciente.map((obj) => (
            <div key={obj.id} className="objetivo-card">
              <h4>{obj.objetivos_terapeuticos?.nombre}</h4>

              <p>
                Avance: <strong>{obj.porcentaje_avance}%</strong>
              </p>

              <progress value={obj.porcentaje_avance} max="100" />
            </div>
          ))}
        </div>
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

          <select
            name="objetivo_trabajado"
            value={form.objetivo_trabajado}
            onChange={handleFormChange}
          >
            <option value="">Objetivo trabajado</option>

            {objetivosPaciente.map((obj) => (
              <option
                key={obj.id}
                value={obj.objetivos_terapeuticos?.nombre}
              >
                {obj.objetivos_terapeuticos?.nombre}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            max="100"
            name="porcentaje_avance"
            placeholder="Porcentaje de avance"
            value={form.porcentaje_avance}
            onChange={handleFormChange}
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

      <section className="expediente-card">
        <h2>Archivos del paciente</h2>

        <input
          type="file"
          onChange={(e) => setArchivo(e.target.files[0])}
        />

        <button type="button" onClick={subirArchivo}>
          Subir archivo
        </button>

        {archivosPaciente.length === 0 && (
          <p className="empty">No hay archivos registrados.</p>
        )}

        <div className="archivos-lista">
          {archivosPaciente.map((item) => (
            <div key={item.id} className="archivo-card">
              <p><strong>{item.nombre_archivo}</strong></p>
              <p>{item.tipo_archivo}</p>

              <button
                type="button"
                onClick={() => abrirArchivo(item.ruta_archivo)}
              >
                Abrir
              </button>

              <button
                type="button"
                className="btn-danger"
                onClick={() => eliminarArchivo(item)}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
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

            <p>
              <strong>Objetivo:</strong> {exp.objetivo_trabajado || 'Sin objetivo'}
            </p>

            <p>
              <strong>Avance:</strong> {exp.porcentaje_avance || 0}%
            </p>

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