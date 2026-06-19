import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function GaleriaAdmin() {
  const [items, setItems] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: ''
  });
  const [mensaje, setMensaje] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  async function cargarGaleria() {
    const { data, error } = await supabase
      .from('galeria_terapias')
      .select('*')
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

  const publicaciones = useMemo(() => {
    const grupos = new Map();

    items.forEach((item) => {
      const id = item.publicacion_id || `legacy-${item.id}`;

      if (!grupos.has(id)) {
        grupos.set(id, {
          ...item,
          publicacion_id: id,
          medios: []
        });
      }

      grupos.get(id).medios.push(item);
    });

    return Array.from(grupos.values())
      .map((publicacion) => ({
        ...publicacion,
        medios: publicacion.medios.sort((a, b) => a.orden - b.orden)
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [items]);

  const urlPublica = (ruta) => {
    const { data } = supabase.storage
      .from('galeria-terapias')
      .getPublicUrl(ruta);

    return data.publicUrl;
  };

  const subirContenido = async (event) => {
    event.preventDefault();
    setMensaje('');

    if (archivos.length === 0) {
      setMensaje('Selecciona una o mas imagenes o videos.');
      return;
    }

    const archivoInvalido = archivos.find((archivo) => (
      !archivo.type.startsWith('image/') && !archivo.type.startsWith('video/')
    ));

    if (archivoInvalido) {
      setMensaje('Solo se permiten imagenes o videos.');
      return;
    }

    const archivoMuyGrande = archivos.find((archivo) => {
      const limite = archivo.type.startsWith('video/')
        ? 80 * 1024 * 1024
        : 8 * 1024 * 1024;

      return archivo.size > limite;
    });

    if (archivoMuyGrande) {
      setMensaje(archivoMuyGrande.type.startsWith('video/')
        ? 'El video no debe superar 80 MB.'
        : 'La imagen no debe superar 8 MB.');
      return;
    }

    setSubiendo(true);

    const publicacionId = crypto.randomUUID();
    const archivosSubidos = [];
    const registros = [];

    for (let index = 0; index < archivos.length; index += 1) {
      const archivo = archivos[index];
      const extension = archivo.name.split('.').pop()?.toLowerCase() || 'bin';
      const ruta = `${publicacionId}/${crypto.randomUUID()}.${extension}`;

      const { error: errorUpload } = await supabase.storage
        .from('galeria-terapias')
        .upload(ruta, archivo);

      if (errorUpload) {
        await supabase.storage.from('galeria-terapias').remove(archivosSubidos);
        setSubiendo(false);
        setMensaje('No se pudieron subir todos los archivos.');
        console.error(errorUpload);
        return;
      }

      archivosSubidos.push(ruta);
      registros.push({
        publicacion_id: publicacionId,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        tipo: archivo.type.startsWith('video/') ? 'video' : 'imagen',
        ruta_archivo: ruta,
        orden: index
      });
    }

    const { error: errorBD } = await supabase
      .from('galeria_terapias')
      .insert(registros);

    setSubiendo(false);

    if (errorBD) {
      await supabase.storage.from('galeria-terapias').remove(archivosSubidos);
      setMensaje('Los archivos subieron, pero no se pudo publicar el tema.');
      console.error(errorBD);
      return;
    }

    setMensaje('Publicacion creada correctamente.');
    setArchivos([]);
    setForm({ titulo: '', descripcion: '' });
    cargarGaleria();
  };

  const cambiarActivo = async (publicacion) => {
    const { error } = await supabase
      .from('galeria_terapias')
      .update({ activo: !publicacion.activo, updated_at: new Date().toISOString() })
      .eq('publicacion_id', publicacion.publicacion_id);

    if (error) {
      setMensaje('No se pudo actualizar el contenido.');
      return;
    }

    cargarGaleria();
  };

  const eliminarContenido = async (publicacion) => {
    const confirmar = window.confirm('Deseas eliminar esta publicacion completa?');

    if (!confirmar) return;

    const { error } = await supabase
      .from('galeria_terapias')
      .delete()
      .eq('publicacion_id', publicacion.publicacion_id);

    if (error) {
      setMensaje('No se pudo eliminar el contenido.');
      return;
    }

    await supabase.storage
      .from('galeria-terapias')
      .remove(publicacion.medios.map((medio) => medio.ruta_archivo));
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
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(event) => setArchivos(Array.from(event.target.files || []))}
            required
          />

          {archivos.length > 0 && (
            <small>{archivos.length} archivo{archivos.length === 1 ? '' : 's'} seleccionado{archivos.length === 1 ? '' : 's'}</small>
          )}

          <button type="submit" disabled={subiendo}>
            {subiendo ? 'Subiendo...' : 'Publicar contenido'}
          </button>
        </form>
      </section>

      <section className="dashboard-section">
        <h2>Contenido publicado</h2>

        <div className="galeria-admin-grid">
          {publicaciones.map((item) => (
            <article className="galeria-admin-card" key={item.publicacion_id}>
              <div className="galeria-admin-media-strip">
                {item.medios.map((medio) => (
                  medio.tipo === 'video' ? (
                    <video key={medio.id} src={urlPublica(medio.ruta_archivo)} controls />
                  ) : (
                    <img key={medio.id} src={urlPublica(medio.ruta_archivo)} alt={item.titulo} />
                  )
                ))}
              </div>

              <h3>{item.titulo}</h3>
              <p>{item.descripcion || 'Sin descripcion'}</p>
              <p>{item.medios.length} archivo{item.medios.length === 1 ? '' : 's'}</p>
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
