import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function GaleriaAdmin() {
  const [items, setItems] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    orden: 0
  });
  const [mensaje, setMensaje] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  async function cargarGaleria() {
    const { data, error } = await supabase
      .from('galeria_terapias')
      .select('*')
      .order('orden', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      setMensaje('No se pudo cargar la galeria.');
      console.error(error);
      return;
    }

    setItems(data || []);
  }

  useEffect(() => {
    cargarGaleria();
  }, []);

  const urlPublica = (ruta) => {
    const { data } = supabase.storage
      .from('galeria-terapias')
      .getPublicUrl(ruta);

    return data.publicUrl;
  };

  const subirContenido = async (event) => {
    event.preventDefault();
    setMensaje('');

    if (!archivo) {
      setMensaje('Selecciona una imagen o video.');
      return;
    }

    const esImagen = archivo.type.startsWith('image/');
    const esVideo = archivo.type.startsWith('video/');

    if (!esImagen && !esVideo) {
      setMensaje('Solo se permiten imagenes o videos.');
      return;
    }

    const limite = esVideo ? 80 * 1024 * 1024 : 8 * 1024 * 1024;

    if (archivo.size > limite) {
      setMensaje(esVideo
        ? 'El video no debe superar 80 MB.'
        : 'La imagen no debe superar 8 MB.');
      return;
    }

    setSubiendo(true);

    const extension = archivo.name.split('.').pop()?.toLowerCase() || 'bin';
    const ruta = `${crypto.randomUUID()}.${extension}`;

    const { error: errorUpload } = await supabase.storage
      .from('galeria-terapias')
      .upload(ruta, archivo);

    if (errorUpload) {
      setSubiendo(false);
      setMensaje('No se pudo subir el archivo.');
      console.error(errorUpload);
      return;
    }

    const { error: errorBD } = await supabase
      .from('galeria_terapias')
      .insert([{
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        tipo: esVideo ? 'video' : 'imagen',
        ruta_archivo: ruta,
        orden: Number(form.orden) || 0
      }]);

    setSubiendo(false);

    if (errorBD) {
      await supabase.storage.from('galeria-terapias').remove([ruta]);
      setMensaje('El archivo subio, pero no se pudo publicar.');
      console.error(errorBD);
      return;
    }

    setMensaje('Contenido publicado correctamente.');
    setArchivo(null);
    setForm({ titulo: '', descripcion: '', orden: 0 });
    cargarGaleria();
  };

  const cambiarActivo = async (item) => {
    const { error } = await supabase
      .from('galeria_terapias')
      .update({ activo: !item.activo, updated_at: new Date().toISOString() })
      .eq('id', item.id);

    if (error) {
      setMensaje('No se pudo actualizar el contenido.');
      return;
    }

    cargarGaleria();
  };

  const eliminarContenido = async (item) => {
    const confirmar = window.confirm('Deseas eliminar este contenido de la galeria?');

    if (!confirmar) return;

    const { error } = await supabase
      .from('galeria_terapias')
      .delete()
      .eq('id', item.id);

    if (error) {
      setMensaje('No se pudo eliminar el contenido.');
      return;
    }

    await supabase.storage.from('galeria-terapias').remove([item.ruta_archivo]);
    cargarGaleria();
  };

  return (
    <main className="container">
      <section className="dashboard-section">
        <h1>Galeria publica</h1>
        <p className="subtitle">
          Sube imagenes o videos que se mostraran en la pagina publica.
        </p>

        {mensaje && <p className="admin-message">{mensaje}</p>}

        <form className="form user-admin-form" onSubmit={subirContenido}>
          <input
            type="text"
            placeholder="Titulo"
            value={form.titulo}
            onChange={(event) => setForm({ ...form, titulo: event.target.value })}
            required
          />

          <textarea
            placeholder="Descripcion opcional"
            value={form.descripcion}
            onChange={(event) => setForm({ ...form, descripcion: event.target.value })}
          />

          <input
            type="number"
            placeholder="Orden"
            value={form.orden}
            onChange={(event) => setForm({ ...form, orden: event.target.value })}
          />

          <input
            type="file"
            accept="image/*,video/*"
            onChange={(event) => setArchivo(event.target.files[0])}
            required
          />

          <button type="submit" disabled={subiendo}>
            {subiendo ? 'Subiendo...' : 'Publicar contenido'}
          </button>
        </form>
      </section>

      <section className="dashboard-section">
        <h2>Contenido publicado</h2>

        <div className="galeria-admin-grid">
          {items.map((item) => (
            <article className="galeria-admin-card" key={item.id}>
              {item.tipo === 'video' ? (
                <video src={urlPublica(item.ruta_archivo)} controls />
              ) : (
                <img src={urlPublica(item.ruta_archivo)} alt={item.titulo} />
              )}

              <h3>{item.titulo}</h3>
              <p>{item.descripcion || 'Sin descripcion'}</p>
              <span>{item.activo ? 'Visible' : 'Oculto'}</span>

              <div className="acciones">
                <button type="button" onClick={() => cambiarActivo(item)}>
                  {item.activo ? 'Ocultar' : 'Mostrar'}
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => eliminarContenido(item)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default GaleriaAdmin;
