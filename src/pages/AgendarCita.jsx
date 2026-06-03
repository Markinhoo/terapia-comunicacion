import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function AgendarCita() {
  const [form, setForm] = useState({
    nombre_paciente: '',
    edad: '',
    nombre_responsable: '',
    telefono: '',
    correo: '',
    servicio: '',
    modalidad: 'Presencial',
    fecha: '',
    hora: '',
    motivo_consulta: ''
  });

  const [mensaje, setMensaje] = useState('');

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const guardarCita = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from('citas').insert([form]);

    if (error) {
      setMensaje('Ocurrió un error al registrar la cita.');
      console.error(error);
    } else {
      setMensaje('La cita fue registrada correctamente.');
      setForm({
        nombre_paciente: '',
        edad: '',
        nombre_responsable: '',
        telefono: '',
        correo: '',
        servicio: '',
        modalidad: 'Presencial',
        fecha: '',
        hora: '',
        motivo_consulta: ''
      });
    }
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
          placeholder="Edad"
          value={form.edad}
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
          placeholder="Teléfono de contacto"
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

        <select
          name="modalidad"
          value={form.modalidad}
          onChange={handleChange}
        >
          <option value="Presencial">Presencial</option>
          <option value="En línea">En línea</option>
        </select>

        <input
          name="fecha"
          type="date"
          value={form.fecha}
          onChange={handleChange}
          required
        />

        <input
          name="hora"
          type="time"
          value={form.hora}
          onChange={handleChange}
          required
        />

        <textarea
          name="motivo_consulta"
          placeholder="Describe brevemente el motivo de consulta"
          value={form.motivo_consulta}
          onChange={handleChange}
        />

        <button type="submit">Registrar cita</button>
      </form>

      {mensaje && <p className="mensaje">{mensaje}</p>}
    </main>
  );
}

export default AgendarCita;