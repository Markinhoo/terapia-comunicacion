import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useClinica } from '../contexts/clinica';
import {
  COLORES_PREDETERMINADOS,
  colorTextoSobre,
  colorValido,
  urlMapaInsertable,
  urlMapaPorDireccion
} from '../utils/clinicBranding';

function AparienciaClinica() {
  const clinica = useClinica();
  const [form, setForm] = useState({
    color_primario: colorValido(clinica.color_primario, COLORES_PREDETERMINADOS.color_primario),
    color_secundario: colorValido(clinica.color_secundario, COLORES_PREDETERMINADOS.color_secundario),
    color_boton: colorValido(clinica.color_boton, COLORES_PREDETERMINADOS.color_boton),
    direccion: clinica.direccion || '',
    mapa_url: clinica.mapa_url || '',
    mapa_embed_url: clinica.mapa_embed_url || ''
  });
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const mapa = urlMapaInsertable(form.mapa_embed_url) || urlMapaPorDireccion(form.direccion);

  const guardar = async (event) => {
    event.preventDefault();
    setMensaje('');
    const embed = urlMapaInsertable(form.mapa_embed_url);
    if (form.mapa_embed_url.trim() && !embed) {
      setMensaje('Pega una URL o el código de inserción de Google Maps válido.');
      return;
    }

    setGuardando(true);
    const { error } = await supabase.rpc('actualizar_apariencia_clinica', {
      p_clinica_id: clinica.id,
      p_color_primario: form.color_primario,
      p_color_secundario: form.color_secundario,
      p_color_boton: form.color_boton,
      p_direccion: form.direccion.trim(),
      p_mapa_url: form.mapa_url.trim(),
      p_mapa_embed_url: embed
    });

    if (error) {
      setMensaje(error.message);
    } else {
      try {
        await clinica.refrescar();
        setMensaje('Apariencia y ubicación actualizadas.');
      } catch {
        setMensaje('Se guardó, pero no se pudo actualizar la vista. Recarga la página.');
      }
    }
    setGuardando(false);
  };

  return <div className="container apariencia-page">
    <div className="section-header">
      <h1>Apariencia de {clinica.nombre}</h1>
      <p>Personaliza la identidad visual de esta clínica sin afectar a las demás.</p>
    </div>
    <form className="dashboard-section apariencia-form" onSubmit={guardar}>
      <h2>Colores</h2>
      <div className="apariencia-colores">
        {[
          ['color_primario', 'Color principal'],
          ['color_secundario', 'Color secundario'],
          ['color_boton', 'Color de botones']
        ].map(([campo, etiqueta]) => <label className="apariencia-color" key={campo}>
          <span>{etiqueta}</span>
          <input type="color" value={form[campo]} onChange={(event) => setForm({ ...form, [campo]: event.target.value })} />
          <code>{form[campo].toUpperCase()}</code>
        </label>)}
      </div>
      <div className="apariencia-preview" style={{ '--preview-primary': form.color_primario, '--preview-secondary': form.color_secundario, '--preview-button': form.color_boton, '--preview-button-text': colorTextoSobre(form.color_boton) }}>
        <span>Vista previa</span>
        <strong>{clinica.nombre}</strong>
        <div className="apariencia-preview-row"><span>Color secundario</span><span>Agenda y servicios</span></div>
        <span className="apariencia-preview-button">Agendar valoración</span>
      </div>

      <h2>Ubicación</h2>
      <label className="apariencia-field">Dirección de la clínica
        <input value={form.direccion} onChange={(event) => setForm({ ...form, direccion: event.target.value })} placeholder="Calle, número, ciudad y estado" />
      </label>
      <label className="apariencia-field">Enlace para abrir Google Maps
        <input type="url" value={form.mapa_url} onChange={(event) => setForm({ ...form, mapa_url: event.target.value })} placeholder="https://maps.app.goo.gl/..." />
      </label>
      <label className="apariencia-field">Mapa para insertar
        <input value={form.mapa_embed_url} onChange={(event) => setForm({ ...form, mapa_embed_url: event.target.value })} placeholder="Pega la URL o el código iframe de Google Maps" />
        <small>En Google Maps: Compartir → Incorporar un mapa → Copiar HTML. El enlace corto por sí solo no se puede insertar; si hay dirección, se mostrará una vista aproximada mientras tanto.</small>
      </label>
      {mapa && <div className="apariencia-map-preview">
        <iframe title="Vista previa de ubicación" src={mapa} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>}
      <button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar apariencia y ubicación'}</button>
      {mensaje && <p role="status" className="apariencia-message">{mensaje}</p>}
    </form>
  </div>;
}

export default AparienciaClinica;
