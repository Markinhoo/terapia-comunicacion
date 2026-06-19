import { useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowLeft, FaHeart, FaRegHeart } from 'react-icons/fa6';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import GalleryMagicBento from '../components/GalleryMagicBento';

function obtenerVisitanteId() {
  const guardado = window.localStorage.getItem('galeria_visitante_id');

  if (guardado) return guardado;

  const nuevo = crypto.randomUUID();
  window.localStorage.setItem('galeria_visitante_id', nuevo);
  return nuevo;
}

function obtenerLikesLocales() {
  try {
    return JSON.parse(window.localStorage.getItem('galeria_likes') || '[]');
  } catch {
    return [];
  }
}

function Galeria() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [publicacionActiva, setPublicacionActiva] = useState(null);
  const [mediosActivos, setMediosActivos] = useState({});
  const [likesLocales, setLikesLocales] = useState(obtenerLikesLocales);
  const [procesandoLike, setProcesandoLike] = useState(null);
  const overlayRef = useRef(null);
  const carouselRefs = useRef(new Map());

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

  useEffect(() => {
    document.body.style.overflow = publicacionActiva ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [publicacionActiva]);

  const publicaciones = useMemo(() => {
    const grupos = new Map();

    items.forEach((item) => {
      const id = item.publicacion_id || `legacy-${item.id}`;

      if (!grupos.has(id)) {
        grupos.set(id, {
          id,
          titulo: item.titulo,
          descripcion: item.descripcion,
          orden: item.orden,
          created_at: item.created_at,
          likes_count: item.likes_count || 0,
          medios: []
        });
      }

      grupos.get(id).medios.push(item);
    });

    return Array.from(grupos.values()).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }, [items]);

  const publicacionUrlId = new URLSearchParams(location.search).get('publicacion');

  useEffect(() => {
    if (!publicacionUrlId) {
      setPublicacionActiva(null);
      return;
    }

    const encontrada = publicaciones.find(
      (publicacion) => String(publicacion.id) === publicacionUrlId
    );

    if (encontrada) setPublicacionActiva(encontrada);
  }, [publicacionUrlId, publicaciones]);

  const urlPublica = (ruta) => {
    const { data } = supabase.storage
      .from('galeria-terapias')
      .getPublicUrl(ruta);

    return data.publicUrl;
  };

  const abrirPublicacion = (publicacion) => {
    setPublicacionActiva(publicacion);
    navigate(`/galeria?publicacion=${encodeURIComponent(publicacion.id)}`, {
      state: { visorGaleria: true }
    });
  };

  const cerrarPublicacion = () => {
    if (publicacionUrlId) {
      if (location.state?.visorGaleria) {
        navigate(-1);
      } else {
        navigate('/galeria', { replace: true });
      }
      return;
    }

    setPublicacionActiva(null);
  };

  useEffect(() => {
    if (!publicacionActiva) return;

    const frame = window.requestAnimationFrame(() => {
      const publicacion = document.getElementById(`publicacion-${publicacionActiva.id}`);
      const overlay = overlayRef.current;

      if (publicacion && overlay) {
        overlay.scrollTo({
          top: Math.max(0, publicacion.offsetTop - 52),
          behavior: 'auto'
        });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [publicacionActiva]);

  const desplazarMedia = (publicacion, index) => {
    const carousel = carouselRefs.current.get(publicacion.id);
    if (!carousel) return;

    const siguiente = Math.max(0, Math.min(publicacion.medios.length - 1, index));

    carousel.scrollTo({
      left: carousel.clientWidth * siguiente,
      behavior: 'smooth'
    });
    setMediosActivos((actuales) => ({
      ...actuales,
      [publicacion.id]: siguiente
    }));
  };

  const actualizarMediaActiva = (publicacion) => {
    const carousel = carouselRefs.current.get(publicacion.id);
    if (!carousel?.clientWidth) return;

    setMediosActivos((actuales) => ({
      ...actuales,
      [publicacion.id]: Math.round(carousel.scrollLeft / carousel.clientWidth)
    }));
  };

  const alternarLike = async (publicacion) => {
    if (!publicacion || procesandoLike) return;

    setProcesandoLike(publicacion.id);

    const { data, error } = await supabase.rpc('alternar_like_galeria', {
      p_publicacion_id: publicacion.id,
      p_visitante_id: obtenerVisitanteId()
    });

    setProcesandoLike(null);

    if (error || !data?.[0]) {
      console.error(error);
      return;
    }

    const resultado = data[0];
    const nuevosLikes = resultado.liked
      ? [...new Set([...likesLocales, publicacion.id])]
      : likesLocales.filter((id) => id !== publicacion.id);

    setLikesLocales(nuevosLikes);
    window.localStorage.setItem('galeria_likes', JSON.stringify(nuevosLikes));

    setItems((actuales) => actuales.map((item) => (
      (item.publicacion_id || `legacy-${item.id}`) === publicacion.id
        ? { ...item, likes_count: resultado.likes_count }
        : item
    )));

    setPublicacionActiva((actual) => (
      actual?.id === publicacion.id
        ? { ...actual, likes_count: resultado.likes_count }
        : actual
    ));
  };

  const formatearFechaPublicacion = (fecha) => (
    new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(fecha))
  );

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

      <GalleryMagicBento
        publications={publicaciones}
        getMediaUrl={urlPublica}
        onOpen={abrirPublicacion}
      />

      <section className="instagram-gallery-grid" aria-label="Publicaciones de terapia">
        {publicaciones.map((publicacion) => {
          const portada = publicacion.medios[0];

          return (
            <button
              type="button"
              className="instagram-grid-item"
              key={publicacion.id}
              onClick={() => abrirPublicacion(publicacion)}
              aria-label={`Abrir ${publicacion.titulo}`}
            >
              {portada.tipo === 'video' ? (
                <video src={urlPublica(portada.ruta_archivo)} muted preload="metadata" />
              ) : (
                <img
                  src={urlPublica(portada.ruta_archivo)}
                  alt={publicacion.titulo}
                  loading="lazy"
                />
              )}

              {publicacion.medios.length > 1 && (
                <span className="instagram-multi-count">
                  {publicacion.medios.length}
                </span>
              )}
            </button>
          );
        })}
      </section>

      {publicacionActiva && (
        <div
          className="instagram-viewer-overlay"
          role="dialog"
          aria-modal="true"
          ref={overlayRef}
        >
          <header className="instagram-feed-header">
            <button
              type="button"
              className="instagram-feed-back"
              onClick={cerrarPublicacion}
              aria-label="Regresar a la galeria"
            >
              <FaArrowLeft />
            </button>
            <div>
              <strong>Clinica Casas</strong>
              <span>Publicaciones</span>
            </div>
            <span className="instagram-feed-header-spacer" aria-hidden="true" />
          </header>

          <div className="instagram-feed">
            {publicaciones.map((publicacion) => {
              const mediaIndex = mediosActivos[publicacion.id] || 0;

              return (
                <article
                  className="instagram-post-viewer"
                  id={`publicacion-${publicacion.id}`}
                  key={publicacion.id}
                >
                  <header className="instagram-post-header">
                    <div>
                      <strong>Clinica Casas</strong>
                      <span>Sesion de terapia</span>
                    </div>
                  </header>

                  <div className="instagram-media-shell">
                    <div
                      className="instagram-media-carousel"
                      ref={(element) => {
                        if (element) carouselRefs.current.set(publicacion.id, element);
                      }}
                      onScroll={() => actualizarMediaActiva(publicacion)}
                    >
                      {publicacion.medios.map((medio) => (
                        <div className="instagram-media-slide" key={medio.id}>
                          {medio.tipo === 'video' ? (
                            <video src={urlPublica(medio.ruta_archivo)} controls playsInline />
                          ) : (
                            <img
                              src={urlPublica(medio.ruta_archivo)}
                              alt={publicacion.titulo}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {publicacion.medios.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="instagram-media-nav previous"
                          onClick={() => desplazarMedia(publicacion, mediaIndex - 1)}
                          disabled={mediaIndex === 0}
                          aria-label="Foto anterior"
                        >
                          {'<'}
                        </button>
                        <button
                          type="button"
                          className="instagram-media-nav next"
                          onClick={() => desplazarMedia(publicacion, mediaIndex + 1)}
                          disabled={mediaIndex === publicacion.medios.length - 1}
                          aria-label="Foto siguiente"
                        >
                          {'>'}
                        </button>
                      </>
                    )}
                  </div>

                  {publicacion.medios.length > 1 && (
                    <div className="instagram-media-dots">
                      {publicacion.medios.map((medio, index) => (
                        <button
                          type="button"
                          key={medio.id}
                          className={index === mediaIndex ? 'active' : ''}
                          onClick={() => desplazarMedia(publicacion, index)}
                          aria-label={`Mostrar archivo ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="instagram-post-actions">
                    <button
                      type="button"
                      className={likesLocales.includes(publicacion.id) ? 'liked' : ''}
                      onClick={() => alternarLike(publicacion)}
                      disabled={procesandoLike === publicacion.id}
                      aria-label="Dar me gusta"
                    >
                      {likesLocales.includes(publicacion.id)
                        ? <FaHeart />
                        : <FaRegHeart />}
                    </button>
                    <strong>{publicacion.likes_count || 0} Me gusta</strong>
                  </div>

                  <div className="instagram-post-copy">
                    <p>
                      <strong>Clinica Casas</strong>{' '}
                      {publicacion.titulo}
                    </p>
                    {publicacion.descripcion && (
                      <p>{publicacion.descripcion}</p>
                    )}
                    <time dateTime={publicacion.created_at}>
                      {formatearFechaPublicacion(publicacion.created_at)}
                    </time>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}

export default Galeria;
