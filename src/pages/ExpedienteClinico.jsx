import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { generarPDF } from '../utils/generarPDF';
import { formatearFechaLocal } from '../utils/fechas';
import ControlSesiones from '../components/ControlSesiones';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

function AccordionSection({ id, title, openSection, setOpenSection, children }) {
  const open = openSection === id;

  return (
    <section className={`expediente-accordion ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="accordion-header"
        onClick={() => setOpenSection(open ? null : id)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <strong>{open ? '-' : '+'}</strong>
      </button>

      {open && (
        <div className="accordion-content">
          {children}
        </div>
      )}
    </section>
  );
}

function ExpedienteClinico() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [objetivos, setObjetivos] = useState([]);
  const [objetivosPaciente, setObjetivosPaciente] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [archivosPaciente, setArchivosPaciente] = useState([]);
  const [fotoArchivo, setFotoArchivo] = useState(null);
  const [fotoUrl, setFotoUrl] = useState('');
  const [openSection, setOpenSection] = useState(null);
  const { toast, mostrarToast, cerrarToast } = useToast();

  const [detalle, setDetalle] = useState({
    fecha_nacimiento: '',
    foto_ruta: '',
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

  async function obtenerPaciente() {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', pacienteId)
      .single();

    if (!error) setPaciente(data);
    else console.error(error);
  }

  async function obtenerDetallePaciente() {
    const { data, error } = await supabase
      .from('paciente_detalle')
      .select('*')
      .eq('paciente_id', pacienteId)
      .maybeSingle();

    if (!error && data) {
      setDetalle({
        fecha_nacimiento: data.fecha_nacimiento || '',
        foto_ruta: data.foto_ruta || '',
        sexo: data.sexo || '',
        antecedentes_perinatales: data.antecedentes_perinatales || '',
        antecedentes_medicos: data.antecedentes_medicos || '',
        antecedentes_familiares: data.antecedentes_familiares || '',
        lenguaje_receptivo: data.lenguaje_receptivo || '',
        lenguaje_expresivo: data.lenguaje_expresivo || '',
        articulacion: data.articulacion || '',
        diagnostico_inicial: data.diagnostico_inicial || ''
      });

      if (data.foto_ruta) {
        obtenerFotoPaciente(data.foto_ruta);
      }
    }
  }

  async function obtenerFotoPaciente(ruta) {
    const { data, error } = await supabase.storage
      .from('expedientes')
      .createSignedUrl(ruta, 60 * 60);

    if (!error) setFotoUrl(data.signedUrl);
    else console.error(error);
  }

  async function obtenerExpedientes() {
    const { data, error } = await supabase
      .from('expedientes')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false });

    if (!error) setExpedientes(data);
    else console.error(error);
  }

  async function obtenerObjetivos() {
    const { data, error } = await supabase
      .from('objetivos_terapeuticos')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (!error) setObjetivos(data);
    else console.error(error);
  }

  async function obtenerObjetivosPaciente() {
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
  }

  async function obtenerArchivosPaciente() {
    const { data, error } = await supabase
      .from('archivos_paciente')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha_subida', { ascending: false });

    if (!error) setArchivosPaciente(data);
    else console.error(error);
  }

  useEffect(() => {
    obtenerPaciente();
    obtenerDetallePaciente();
    obtenerExpedientes();
    obtenerObjetivos();
    obtenerObjetivosPaciente();
    obtenerArchivosPaciente();
    // These loaders only depend on the route patient id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  const handleDetalleChange = (e) => {
    setDetalle({
      ...detalle,
      [e.target.name]: e.target.value
    });
  };

  const handleFormChange = (e) => {
    const value = e.target.name === 'porcentaje_avance'
      ? Math.max(0, Math.min(100, Number(e.target.value) || 0))
      : e.target.value;

    setForm({
      ...form,
      [e.target.name]: value
    });
  };

  const seleccionarObjetivoParaNota = (objetivoNombre) => {
    setForm((actual) => ({
      ...actual,
      objetivo_trabajado: objetivoNombre
    }));
    setOpenSection('nota');
    mostrarToast(`Objetivo seleccionado: ${objetivoNombre}`, 'success');
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
      mostrarToast('No se pudo consultar la ficha clinica.', 'error');
      console.error(errorConsulta);
      return;
    }

    if (existente) {
      const { error } = await supabase
        .from('paciente_detalle')
        .update(registro)
        .eq('paciente_id', pacienteId);

      if (error) {
        mostrarToast('No se pudo actualizar la ficha clinica.', 'error');
        console.error(error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('paciente_detalle')
        .insert([registro]);

      if (error) {
        mostrarToast('No se pudo guardar la ficha clinica.', 'error');
        console.error(error);
        return;
      }
    }

    mostrarToast('Ficha clinica guardada correctamente.', 'success');
  };

  const subirFotoPaciente = async () => {
    if (!fotoArchivo) {
      mostrarToast('Selecciona una foto del paciente.', 'error');
      return;
    }

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    const limiteBytes = 5 * 1024 * 1024;

    if (!tiposPermitidos.includes(fotoArchivo.type)) {
      mostrarToast('La foto debe ser JPG, PNG o WEBP.', 'error');
      return;
    }

    if (fotoArchivo.size > limiteBytes) {
      mostrarToast('La foto no debe superar 5 MB.', 'error');
      return;
    }

    const extension = fotoArchivo.name.split('.').pop()?.toLowerCase() || 'jpg';
    const ruta = `${pacienteId}/foto-paciente-${crypto.randomUUID()}.${extension}`;

    const { error: errorUpload } = await supabase.storage
      .from('expedientes')
      .upload(ruta, fotoArchivo);

    if (errorUpload) {
      mostrarToast('No se pudo subir la foto.', 'error');
      console.error(errorUpload);
      return;
    }

    const registro = {
      paciente_id: Number(pacienteId),
      ...detalle,
      foto_ruta: ruta
    };

    const { data: existente, error: errorConsulta } = await supabase
      .from('paciente_detalle')
      .select('id, foto_ruta')
      .eq('paciente_id', pacienteId)
      .maybeSingle();

    if (errorConsulta) {
      mostrarToast('No se pudo consultar la ficha clinica.', 'error');
      console.error(errorConsulta);
      return;
    }

    const guardar = existente
      ? supabase.from('paciente_detalle').update(registro).eq('paciente_id', pacienteId)
      : supabase.from('paciente_detalle').insert([registro]);

    const { error: errorBD } = await guardar;

    if (errorBD) {
      mostrarToast('La foto se subio, pero no se pudo guardar en la ficha.', 'error');
      console.error(errorBD);
      return;
    }

    if (existente?.foto_ruta && existente.foto_ruta !== ruta) {
      await supabase.storage.from('expedientes').remove([existente.foto_ruta]);
    }

    setDetalle((actual) => ({ ...actual, foto_ruta: ruta }));
    setFotoArchivo(null);
    obtenerFotoPaciente(ruta);
    mostrarToast('Foto del paciente guardada correctamente.', 'success');
  };

  const agregarObjetivoPaciente = async (objetivoId) => {
    if (!objetivoId) return;

    const yaExiste = objetivosPaciente.some(
      (obj) => String(obj.objetivo_id) === String(objetivoId)
    );

    if (yaExiste) {
      mostrarToast('Este objetivo ya esta asignado al paciente.', 'error');
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
      mostrarToast('No se pudo asignar el objetivo.', 'error');
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
      fecha: formatearFechaLocal(),
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
      mostrarToast('No se pudo guardar la nota clinica.', 'error');
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
    mostrarToast('Nota clinica guardada correctamente.', 'success');
  };

  const subirArchivo = async () => {
    if (!archivo) {
      mostrarToast('Selecciona un archivo.', 'error');
      return;
    }

    const tiposPermitidos = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const limiteBytes = 10 * 1024 * 1024;

    if (!tiposPermitidos.includes(archivo.type)) {
      mostrarToast('Solo se permiten archivos PDF, JPG, PNG, DOC o DOCX.', 'error');
      return;
    }

    if (archivo.size > limiteBytes) {
      mostrarToast('El archivo no debe superar 10 MB.', 'error');
      return;
    }

    const extension = archivo.name.split('.').pop()?.toLowerCase() || 'bin';
    const ruta = `${pacienteId}/${crypto.randomUUID()}.${extension}`;

    const { error: errorUpload } = await supabase.storage
      .from('expedientes')
      .upload(ruta, archivo);

    if (errorUpload) {
      mostrarToast('No se pudo subir el archivo.', 'error');
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
      const { error: errorLimpieza } = await supabase.storage
        .from('expedientes')
        .remove([ruta]);

      if (errorLimpieza) {
        console.error(errorLimpieza);
      }
    }

    if (errorBD) {
      mostrarToast('El archivo se subio, pero no se pudo guardar el registro.', 'error');
      console.error(errorBD);
      return;
    }

    setArchivo(null);
    obtenerArchivosPaciente();
    mostrarToast('Archivo subido correctamente.', 'success');
  };

  const abrirArchivo = async (ruta) => {
    const { data, error } = await supabase.storage
      .from('expedientes')
      .createSignedUrl(ruta, 60);

    if (error) {
      mostrarToast('No se pudo abrir el archivo.', 'error');
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
      mostrarToast('No se pudo eliminar el archivo del almacenamiento.', 'error');
      console.error(errorStorage);
      return;
    }

    const { error: errorBD } = await supabase
      .from('archivos_paciente')
      .delete()
      .eq('id', archivoPaciente.id);

    if (errorBD) {
      mostrarToast('No se pudo eliminar el registro.', 'error');
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
          onClick={() => generarPDF(paciente, detalle, expedientes, fotoUrl)}
        >
          Generar PDF
        </button>
      )}

      {paciente && (
        <section className="info-section paciente-hero">
          <div className="patient-photo-frame">
            {fotoUrl ? (
              <img src={fotoUrl} alt={`Foto de ${paciente.nombre_paciente}`} />
            ) : (
              <span>{paciente.nombre_paciente?.charAt(0) || 'P'}</span>
            )}
          </div>

          <div className="patient-hero-info">
            <span className="patient-hero-label">Expediente clinico</span>
            <h2>{paciente.nombre_paciente}</h2>
            <p><strong>Edad:</strong> {paciente.edad}</p>
            <p><strong>Responsable:</strong> {paciente.nombre_responsable}</p>
            <p><strong>Telefono:</strong> {paciente.telefono}</p>
            <p><strong>Correo:</strong> {paciente.correo}</p>
          </div>

          <div className="patient-photo-actions">
            <label className="photo-upload-label">
              Foto del paciente
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setFotoArchivo(e.target.files[0])}
              />
            </label>
            <button type="button" onClick={subirFotoPaciente}>
              Guardar foto
            </button>
          </div>
        </section>
      )}

      {paciente && (
        <AccordionSection
          id="sesiones"
          title="Control de terapias y pagos"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <ControlSesiones paciente={paciente} />
        </AccordionSection>
      )}

      <AccordionSection
        id="ficha"
        title="Ficha clinica"
        openSection={openSection}
        setOpenSection={setOpenSection}
      >
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
      </AccordionSection>

      <AccordionSection
        id="plan"
        title="Plan terapeutico"
        openSection={openSection}
        setOpenSection={setOpenSection}
      >
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
          {objetivosPaciente.map((obj) => {
            const nombreObjetivo = obj.objetivos_terapeuticos?.nombre || '';

            return (
              <button
                type="button"
                key={obj.id}
                className={`objetivo-card objetivo-card-button ${
                  form.objetivo_trabajado === nombreObjetivo ? 'selected' : ''
                }`}
                onClick={() => seleccionarObjetivoParaNota(nombreObjetivo)}
              >
                <h4>{nombreObjetivo}</h4>

                <p>
                  Avance: <strong>{obj.porcentaje_avance}%</strong>
                </p>

                <progress value={obj.porcentaje_avance} max="100" />
                <small>Dar clic para abrir una nota clinica de este objetivo.</small>
              </button>
            );
          })}
        </div>
      </section>
      </AccordionSection>

      <AccordionSection
        id="nota"
        title="Nueva nota clinica"
        openSection={openSection}
        setOpenSection={setOpenSection}
      >
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

          <div className="selected-objective">
            <span>Objetivo trabajado</span>
            <strong>
              {form.objetivo_trabajado || 'Selecciona un objetivo desde el plan terapeutico'}
            </strong>
          </div>

          <label className="progress-field">
            <span>Porcentaje de avance del objetivo trabajado (0 a 100)</span>
            <input
              type="number"
              min="0"
              max="100"
              name="porcentaje_avance"
              placeholder="Ejemplo: 45"
              value={form.porcentaje_avance}
              onChange={handleFormChange}
            />
            <progress value={Number(form.porcentaje_avance) || 0} max="100" />
          </label>

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
      </AccordionSection>

      <AccordionSection
        id="archivos"
        title="Archivos del paciente"
        openSection={openSection}
        setOpenSection={setOpenSection}
      >
      <section className="expediente-card">
        <h2>Archivos del paciente</h2>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
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
      </AccordionSection>

      <AccordionSection
        id="historial"
        title="Historial clinico"
        openSection={openSection}
        setOpenSection={setOpenSection}
      >
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
      </AccordionSection>

      <Toast toast={toast} onClose={cerrarToast} />
    </main>
  );
}

export default ExpedienteClinico;
