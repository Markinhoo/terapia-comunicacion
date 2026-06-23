import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatearFechaLocal, sumarDiasFechaLocal } from '../utils/fechas';

function AgendarCita() {
  const hoy = formatearFechaLocal();
  const fechaMaximaCita = sumarDiasFechaLocal(new Date(), 14);
  const fechaNacimientoMinima = `${Number(hoy.slice(0, 4)) - 99}${hoy.slice(4)}`;

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

  const nombrePareceReal = (valor, opciones = {}) => {
    const { nombreCampo = 'nombre', requerirCompleto = false } = opciones;
    const nombre = valor.trim().replace(/\s+/g, ' ');
    const palabras = nombre.split(' ').filter(Boolean);
    const letras = nombre.replace(/\s/g, '');
    const consonantesSeguidas = /[bcdfghjklmnpqrstvwxyzñ]{5,}/i;

    if (!nombre) return `Escribe el ${nombreCampo}.`;
    if (!/^[\p{L}\s]+$/u.test(nombre)) return `El ${nombreCampo} solo debe contener letras.`;
    if (letras.length < 5) return `El ${nombreCampo} es demasiado corto. Escribe un nombre real.`;
    if (requerirCompleto && palabras.length < 2) {
      return 'Escribe el nombre completo del responsable, por ejemplo nombre y apellido.';
    }
    if (palabras.some((palabra) => palabra.length > 16)) {
      return `Revisa el ${nombreCampo}. Hay una palabra demasiado larga para un nombre.`;
    }
    if (/(.)\1{2,}/i.test(nombre) || consonantesSeguidas.test(nombre)) {
      return `Revisa el ${nombreCampo}. Parece tener caracteres escritos al azar.`;
    }
    if (!palabras.some((palabra) => /[aeiouáéíóúü]/i.test(palabra))) {
      return `Revisa el ${nombreCampo}. Debe parecer un nombre valido.`;
    }

    return '';
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;

    const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);
    const fechaActual = new Date(`${hoy}T00:00:00`);

    if (
      Number.isNaN(nacimiento.getTime())
      || nacimiento > fechaActual
      || nacimiento < new Date(`${fechaNacimientoMinima}T00:00:00`)
    ) {
      return null;
    }

    let anos = fechaActual.getFullYear() - nacimiento.getFullYear();
    let meses = fechaActual.getMonth() - nacimiento.getMonth();

    if (fechaActual.getDate() < nacimiento.getDate()) {
      meses -= 1;
    }

    if (meses < 0) {
      anos -= 1;
      meses += 12;
    }

    return { anos, meses };
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

      if (value > fechaMaximaCita) {
        setMensaje('Solo se pueden agendar citas dentro de los proximos 14 dias.');
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

    if (name === 'fecha_nacimiento') {
      const edadCalculada = calcularEdad(value);

      if (value && !edadCalculada) {
        setMensaje('Selecciona una fecha de nacimiento válida para una edad de 0 a 99 años.');
        setTipoMensaje('error');
        setForm({ ...form, fecha_nacimiento: '', edad: '' });
        return;
      }

      setMensaje('');
      setForm({
        ...form,
        fecha_nacimiento: value,
        edad: edadCalculada ? String(edadCalculada.anos).slice(0, 2) : ''
      });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const edadCalculada = calcularEdad(form.fecha_nacimiento);

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

  const validarFormularioMejorado = () => {
    const errorNombrePaciente = nombrePareceReal(form.nombre_paciente, {
      nombreCampo: 'nombre del paciente'
    });

    if (errorNombrePaciente) {
      setMensaje(errorNombrePaciente);
      setTipoMensaje('error');
      return false;
    }

    if (form.nombre_responsable) {
      const errorResponsable = nombrePareceReal(form.nombre_responsable, {
        nombreCampo: 'nombre del responsable',
        requerirCompleto: true
      });

      if (errorResponsable) {
        setMensaje(errorResponsable);
        setTipoMensaje('error');
        return false;
      }
    }

    if (!form.fecha_nacimiento) {
      setMensaje('Selecciona la fecha de nacimiento del paciente.');
      setTipoMensaje('error');
      return false;
    }

    if (form.fecha > fechaMaximaCita) {
      setMensaje('Solo se pueden agendar citas dentro de los proximos 14 dias.');
      setTipoMensaje('error');
      return false;
    }

    return true;
  };

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

    if (!validarFormularioMejorado() || !validarFormulario()) return;
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

        <label className="form-field">
          <span>Fecha de nacimiento del paciente</span>
          <input
            name="fecha_nacimiento"
            type="date"
            min={fechaNacimientoMinima}
            max={hoy}
            value={form.fecha_nacimiento}
            onChange={handleChange}
          />
          <small>Al seleccionarla se calcularán automáticamente los años y meses.</small>
        </label>

        <label className="form-field">
          <span>Edad calculada del paciente</span>
          <input
            name="edad"
            type="text"
            inputMode="numeric"
            maxLength={2}
            placeholder="Edad en años"
            value={form.edad}
            readOnly
          />
          <small>
            {edadCalculada
              ? `${edadCalculada.anos} año${edadCalculada.anos === 1 ? '' : 's'} y ${edadCalculada.meses} mes${edadCalculada.meses === 1 ? '' : 'es'}`
              : 'Selecciona primero la fecha de nacimiento.'}
          </small>
        </label>

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

        <label className="form-field form-field-highlight">
          <span>Fecha de la cita</span>
          <input
            name="fecha"
            type="date"
            min={hoy}
            max={fechaMaximaCita}
            value={form.fecha}
            onChange={handleChange}
            required
          />
          <small>Selecciona una fecha disponible dentro de los proximos 14 dias.</small>
        </label>

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
