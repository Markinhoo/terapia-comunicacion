import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatearFechaLocal } from '../utils/fechas';

function AgendarCita() {
  const hoy = formatearFechaLocal();

  const [form, setForm] = useState({
    nombre_paciente: '',
    edad: '',
    fecha_nacimiento: '',
    nombre_responsable: '',
    telefono: '',
    correo: '',
    direccion: '',
    contacto_2_nombre: '',
    contacto_2_parentesco: '',
    contacto_2_telefono: '',
    contacto_2_direccion: '',
    contacto_3_nombre: '',
    contacto_3_parentesco: '',
    contacto_3_telefono: '',
    contacto_3_direccion: '',
    observaciones_localizacion: '',
    servicio: '',
    fecha: '',
    hora: '',
    motivo_consulta: ''
  });

  const [horarios, setHorarios] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  const limpiarNombre = (valor) => {
    return valor.replace(/[^a-zA-ZÁÉÍÓÚáéíóúÑñ\s]/g, '');
  };

  const limpiarTelefono = (valor) => {
    return valor.replace(/\D/g, '').slice(0, 10);
  };

  const esDomingo = (fecha) => {
    const dia = new Date(`${fecha}T00:00:00`).getDay();
    return dia === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (
      name === 'nombre_paciente' ||
      name === 'nombre_responsable' ||
      name === 'contacto_2_nombre' ||
      name === 'contacto_3_nombre'
    ) {
      setForm({ ...form, [name]: limpiarNombre(value) });
      return;
    }

    if (
      name === 'telefono' ||
      name === 'contacto_2_telefono' ||
      name === 'contacto_3_telefono'
    ) {
      setForm({ ...form, [name]: limpiarTelefono(value) });
      return;
    }

    if (name === 'fecha') {
      if (value < hoy) {
        setMensaje('No se pueden seleccionar fechas anteriores al día actual.');
        setTipoMensaje('error');
        setForm({ ...form, fecha: '', hora: '' });
        return;
      }

      if (esDomingo(value)) {
        setMensaje('Solo se pueden agendar citas de lunes a sábado.');
        setTipoMensaje('error');
        setForm({ ...form, fecha: '', hora: '' });
        return;
      }

      setMensaje('');
      setForm({ ...form, fecha: value, hora: '' });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  async function obtenerHorariosDisponibles(fecha) {
    const { data, error } = await supabase.rpc(
      'obtener_horarios_disponibles',
      { fecha_consulta: fecha }
    );

    if (error) {
      console.error(error);
      setHorarios([]);
      return;
    }

    setHorarios(data || []);
  }

  useEffect(() => {
    if (form.fecha) {
      obtenerHorariosDisponibles(form.fecha);
    }
  }, [form.fecha]);

  const validarFormulario = () => {
    const soloLetras = /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/;

    if (!soloLetras.test(form.nombre_paciente.trim())) {
      setMensaje('El nombre del paciente solo debe contener letras.');
      setTipoMensaje('error');
      return false;
    }

    if (form.nombre_responsable && !soloLetras.test(form.nombre_responsable.trim())) {
      setMensaje('El nombre del responsable solo debe contener letras.');
      setTipoMensaje('error');
      return false;
    }

    if (form.telefono.length !== 10) {
      setMensaje('El teléfono debe contener exactamente 10 dígitos.');
      setTipoMensaje('error');
      return false;
    }

    if (!form.hora) {
      setMensaje('Selecciona un horario disponible.');
      setTipoMensaje('error');
      return false;
    }

    if (form.fecha < hoy) {
      setMensaje('No se pueden agendar fechas anteriores al día actual.');
      setTipoMensaje('error');
      return false;
    }

    if (esDomingo(form.fecha)) {
      setMensaje('Solo se pueden agendar citas de lunes a sábado.');
      setTipoMensaje('error');
      return false;
    }

    return true;
  };

  const guardarCita = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;
    setEnviando(true);
    setMensaje('');

    const { error } = await supabase.rpc('registrar_cita_publica_v2', {
      p_nombre_paciente: form.nombre_paciente.trim(),
      p_edad: form.edad ? Number(form.edad) : null,
      p_fecha_nacimiento: form.fecha_nacimiento || null,
      p_nombre_responsable: form.nombre_responsable.trim() || null,
      p_telefono: form.telefono,
      p_correo: form.correo.trim() || null,
      p_direccion: form.direccion.trim() || null,
      p_contacto_2_nombre: form.contacto_2_nombre.trim() || null,
      p_contacto_2_parentesco: form.contacto_2_parentesco.trim() || null,
      p_contacto_2_telefono: form.contacto_2_telefono || null,
      p_contacto_2_direccion: form.contacto_2_direccion.trim() || null,
      p_contacto_3_nombre: form.contacto_3_nombre.trim() || null,
      p_contacto_3_parentesco: form.contacto_3_parentesco.trim() || null,
      p_contacto_3_telefono: form.contacto_3_telefono || null,
      p_contacto_3_direccion: form.contacto_3_direccion.trim() || null,
      p_observaciones_localizacion:
        form.observaciones_localizacion.trim() || null,
      p_servicio: form.servicio,
      p_fecha: form.fecha,
      p_hora: form.hora,
      p_motivo_consulta: form.motivo_consulta.trim() || null
    });

    setEnviando(false);

    if (error) {
      setMensaje(error.message || 'Ocurrió un error al registrar la cita.');
      setTipoMensaje('error');
      console.error(error);
      return;
    }

    setMensaje('La cita fue registrada correctamente. Nos comunicaremos para confirmar.');
    setTipoMensaje('exito');

    setForm({
      nombre_paciente: '',
      edad: '',
      fecha_nacimiento: '',
      nombre_responsable: '',
      telefono: '',
      correo: '',
      direccion: '',
      contacto_2_nombre: '',
      contacto_2_parentesco: '',
      contacto_2_telefono: '',
      contacto_2_direccion: '',
      contacto_3_nombre: '',
      contacto_3_parentesco: '',
      contacto_3_telefono: '',
      contacto_3_direccion: '',
      observaciones_localizacion: '',
      servicio: '',
      fecha: '',
      hora: '',
      motivo_consulta: ''
    });

    setHorarios([]);
  };

  return (
    <main className="container">
      <h1>Agendar valoración o cita</h1>

      <form className="form" onSubmit={guardarCita}>
        <input
          name="nombre_paciente"
          placeholder="Nombre del paciente"
          value={form.nombre_paciente}
          onChange={handleChange}
          required
        />

        <input
          name="edad"
          type="number"
          min="0"
          max="120"
          placeholder="Edad"
          value={form.edad}
          onChange={handleChange}
        />

        <input
          name="fecha_nacimiento"
          type="date"
          aria-label="Fecha de nacimiento"
          value={form.fecha_nacimiento}
          onChange={handleChange}
        />

        <input
          name="nombre_responsable"
          placeholder="Nombre del padre, madre o responsable"
          value={form.nombre_responsable}
          onChange={handleChange}
        />

        <input
          name="telefono"
          placeholder="Teléfono a 10 dígitos"
          value={form.telefono}
          onChange={handleChange}
          required
        />

        <input
          name="correo"
          type="email"
          placeholder="Correo electrónico"
          value={form.correo}
          onChange={handleChange}
        />

        <input
          name="direccion"
          placeholder="Direccion del contacto principal"
          value={form.direccion}
          onChange={handleChange}
        />

        <details className="contacto-opcional">
          <summary>Agregar contactos de localizacion</summary>

          <fieldset className="form-group">
            <legend>Contacto 2 (secundario)</legend>
            <input name="contacto_2_nombre" placeholder="Nombre" value={form.contacto_2_nombre} onChange={handleChange} />
            <input name="contacto_2_parentesco" placeholder="Parentesco" value={form.contacto_2_parentesco} onChange={handleChange} />
            <input name="contacto_2_telefono" placeholder="Telefono" value={form.contacto_2_telefono} onChange={handleChange} />
            <input name="contacto_2_direccion" placeholder="Direccion" value={form.contacto_2_direccion} onChange={handleChange} />
          </fieldset>

          <fieldset className="form-group">
            <legend>Contacto 3 (emergencia)</legend>
            <input name="contacto_3_nombre" placeholder="Nombre" value={form.contacto_3_nombre} onChange={handleChange} />
            <input name="contacto_3_parentesco" placeholder="Parentesco" value={form.contacto_3_parentesco} onChange={handleChange} />
            <input name="contacto_3_telefono" placeholder="Telefono" value={form.contacto_3_telefono} onChange={handleChange} />
            <input name="contacto_3_direccion" placeholder="Direccion" value={form.contacto_3_direccion} onChange={handleChange} />
          </fieldset>
        </details>

        <textarea
          name="observaciones_localizacion"
          placeholder="Observaciones adicionales de localizacion o contacto"
          value={form.observaciones_localizacion}
          onChange={handleChange}
        />

        <select
          name="servicio"
          value={form.servicio}
          onChange={handleChange}
          required
        >
          <option value="">Selecciona el servicio</option>
          <option value="Evaluación inicial">Evaluación inicial</option>
          <option value="Terapia de lenguaje infantil">Terapia de lenguaje infantil</option>
          <option value="Estimulación temprana">Estimulación temprana</option>
          <option value="Problemas de articulación">Problemas de articulación</option>
          <option value="Dificultades de lectoescritura">Dificultades de lectoescritura</option>
          <option value="Terapia para adultos">Terapia para adultos</option>
          <option value="Orientación a padres">Orientación a padres</option>
        </select>

        <input
          name="fecha"
          type="date"
          min={hoy}
          value={form.fecha}
          onChange={handleChange}
          required
        />

        <select
          name="hora"
          value={form.hora}
          onChange={handleChange}
          required
          disabled={!form.fecha}
        >
          <option value="">
            {form.fecha ? 'Selecciona un horario' : 'Primero selecciona una fecha'}
          </option>

          {horarios.map((item) => (
            <option
              key={item.hora_disponible}
              value={item.hora_disponible}
              disabled={!item.disponible}
            >
              {item.hora_disponible.slice(0, 5)}
              {item.disponible ? ' - Disponible' : ' - Ocupado'}
            </option>
          ))}
        </select>

        <textarea
          name="motivo_consulta"
          placeholder="Describe brevemente el motivo de consulta"
          value={form.motivo_consulta}
          onChange={handleChange}
        />

        <button type="submit" disabled={enviando}>
          {enviando ? 'Registrando...' : 'Registrar cita'}
        </button>
      </form>

      {mensaje && (
        <p className={tipoMensaje === 'exito' ? 'mensaje' : 'error'}>
          {mensaje}
        </p>
      )}
    </main>
  );
}

export default AgendarCita;
