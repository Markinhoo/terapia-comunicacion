import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import GalleryMagicBento from '../components/GalleryMagicBento';

function Galeria() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function cargarGaleria() {
      const { data, error } = await supabase
        .from('galeria_terapias')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setItems(data || []);
    }

    cargarGaleria();
  }, []);

  const urlPublica = (ruta) => {
    const { data } = supabase.storage
      .from('galeria-terapias')
      .getPublicUrl(ruta);

    return data.publicUrl;
  };

  return (
    <main className="galeria-page">
      <section className="galeria-hero">
        <span className="section-kicker">Galeria</span>
        <h1>Sesiones y momentos de terapia</h1>
        <p>
          Un espacio para compartir avances, actividades y experiencias de
          terapia de comunicacion.
        </p>
      </section>

      {items.length === 0 && (
        <p className="empty">Todavia no hay contenido publicado.</p>
      )}

      <GalleryMagicBento items={items} getMediaUrl={urlPublica} />
    </main>
  );
}

export default Galeria;
