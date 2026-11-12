import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { urlMarca } from '../contexts/clinica';
import ThemeToggle from '../components/ThemeToggle';
import { normalizarMapa } from '../utils/clinicBranding';

const formularioClinicaVacio = { slug: '', nombre: '', subtitulo: '', telefono_whatsapp: '', direccion: '', mapa_url: '' };
const extensionesImagen = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function errorImagen(archivo) {
  return archivo && (!extensionesImagen[archivo.type] || archivo.size > 8 * 1024 * 1024)
    ? 'Selecciona una imagen JPG, PNG o WebP de hasta 8 MB.'
    : '';
}

const soluciones = [
  {
    titulo: 'CRM para relaciones que crecen',
    descripcion: 'Centraliza clientes, tareas y seguimiento en un espacio adaptado a la forma de trabajar de tu equipo.',
    puntos: ['Información organizada', 'Seguimiento de actividades', 'Procesos más claros'],
    imagen: '/vodev-crm.svg',
    alt: 'Ilustración de un CRM con clientes, actividades y seguimiento'
  },
  {
    titulo: 'Puntos de venta pensados para tu operación',
    descripcion: 'Diseñamos herramientas para registrar ventas, consultar productos y tener una visión más clara del negocio.',
    puntos: ['Ventas en un solo flujo', 'Control de productos', 'Reportes útiles'],
    imagen: '/vodev-punto-venta.svg',
    alt: 'Ilustración conceptual de un punto de venta con productos y resumen de ventas'
  },
  {
    titulo: 'Sistemas hechos a la medida',
    descripcion: 'Cuando un proceso no cabe en una solución genérica, creamos software que responde a lo que tu empresa necesita.',
    puntos: ['Diseño según tus procesos', 'Herramientas conectadas', 'Espacio para crecer'],
    imagen: '/vodev-sistemas.svg',
    alt: 'Ilustración de módulos de software conectados para una empresa'
  }
];

function VodevHome() {
  const [clinicas, setClinicas] = useState([]);
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [movimientoReducido, setMovimientoReducido] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const inicioTouch = useRef(null);

  useEffect(() => {
    supabase.from('clinicas').select('id, nombre, logo_ruta')
      .eq('activa', true).order('nombre')
      .then(({ data }) => setClinicas(data || []));
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const actualizar = () => setMovimientoReducido(media.matches);
    media.addEventListener('change', actualizar);
    return () => media.removeEventListener('change', actualizar);
  }, []);

  useEffect(() => {
    if (pausado || movimientoReducido) return undefined;
    const intervalo = window.setInterval(() => setActual((indice) => (indice + 1) % soluciones.length), 6500);
    return () => window.clearInterval(intervalo);
  }, [pausado, movimientoReducido]);

  const mover = (paso) => setActual((indice) => (indice + paso + soluciones.length) % soluciones.length);
  const solucion = soluciones[actual];

  return (
    <main className="vodev-home platform-page">
      <section className="vodev-hero" aria-labelledby="vodev-title">
        <div className="vodev-hero-copy">
          <span className="vodev-eyebrow">VODEV · Desarrollo de software</span>
          <h1 id="vodev-title">Software para hacer crecer tus ideas. <span>A la medida de tu negocio.</span></h1>
          <p>Creamos soluciones digitales para empresas: CRM, puntos de venta y sistemas independientes diseñados alrededor de sus procesos.</p>
          <a className="vodev-link" href="#soluciones">Explora nuestras soluciones <span aria-hidden="true">↗</span></a>
        </div>
        <div className="vodev-hero-art">
          <img src="/vodev-logo.png" alt="Logotipo de VODEV" fetchPriority="high" />
        </div>
      </section>

      <section className="vodev-solutions" id="soluciones" aria-labelledby="vodev-solutions-title">
        <div className="vodev-section-heading">
          <span className="vodev-eyebrow">Lo que podemos construir</span>
          <h2 id="vodev-solutions-title">Tecnología con un propósito claro</h2>
          <p>Desde la gestión cotidiana hasta un sistema propio para tu empresa.</p>
        </div>
        <div className="vodev-carousel" aria-roledescription="carrusel" aria-label="Soluciones de software de VODEV"
          onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}
          onFocus={() => setPausado(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPausado(false); }}
          onTouchStart={(event) => { inicioTouch.current = event.touches[0].clientX; setPausado(true); }}
          onTouchEnd={(event) => {
            if (inicioTouch.current !== null) {
              const distancia = event.changedTouches[0].clientX - inicioTouch.current;
              if (Math.abs(distancia) > 45) mover(distancia < 0 ? 1 : -1);
            }
            inicioTouch.current = null;
            setPausado(false);
          }} onTouchCancel={() => { inicioTouch.current = null; setPausado(false); }}>
          <div className="vodev-slide" key={actual} aria-live={pausado ? 'polite' : 'off'}>
            <div className="vodev-slide-visual"><img src={solucion.imagen} alt={solucion.alt} /></div>
            <div className="vodev-slide-copy">
              <span className="vodev-slide-number">0{actual + 1} / 0{soluciones.length}</span>
              <h3>{solucion.titulo}</h3>
              <p>{solucion.descripcion}</p>
              <ul>{solucion.puntos.map((punto) => <li key={punto}>{punto}</li>)}</ul>
            </div>
          </div>
          <div className="vodev-carousel-controls">
            <button type="button" className="vodev-arrow" onClick={() => mover(-1)} aria-label="Solución anterior">←</button>
            <div className="vodev-dots" aria-label="Seleccionar solución">
              {soluciones.map((item, indice) => <button type="button" key={item.titulo}
                className={indice === actual ? 'vodev-dot active' : 'vodev-dot'}
                aria-label={`Ver solución ${indice + 1}: ${item.titulo}`}
                aria-current={indice === actual ? 'true' : undefined}
                onClick={() => setActual(indice)} />)}
            </div>
            <button type="button" className="vodev-arrow" onClick={() => mover(1)} aria-label="Siguiente solución">→</button>
          </div>
        </div>
      </section>

      <section className="vodev-sectors" id="sectores" aria-labelledby="vodev-sectors-title">
        <div className="vodev-section-heading">
          <span className="vodev-eyebrow">Sectores y proyectos</span>
          <h2 id="vodev-sectors-title">Una solución para cada forma de trabajar</h2>
          <p>Comenzamos en salud y dejamos espacio para construir soluciones en nuevas industrias.</p>
        </div>
        <div className="vodev-sector-grid">
          <article className="vodev-sector-card vodev-sector-active">
            <span className="vodev-sector-icon" aria-hidden="true">+</span>
            <span className="vodev-sector-state">Proyecto activo</span>
            <h3>Salud</h3>
            <p>Gestión de clínicas con agenda, expedientes, seguimiento y finanzas en un mismo sistema.</p>
            <a href="#salud">Conoce este proyecto <span aria-hidden="true">↗</span></a>
          </article>
          <article className="vodev-sector-card">
            <span className="vodev-sector-icon" aria-hidden="true">▦</span>
            <span className="vodev-sector-state">Próximamente</span>
            <h3>Comercio</h3>
            <p>Un espacio para futuros proyectos de ventas, inventario y operación comercial.</p>
          </article>
          <article className="vodev-sector-card">
            <span className="vodev-sector-icon" aria-hidden="true">◇</span>
            <span className="vodev-sector-state">A medida</span>
            <h3>Más industrias</h3>
            <p>Cada empresa tiene retos propios. Aquí podrán sumarse nuevas soluciones y casos de uso.</p>
          </article>
        </div>
      </section>

      <section className="vodev-partners" id="salud" aria-labelledby="vodev-partners-title">
        <div className="vodev-section-heading">
          <span className="vodev-eyebrow">Proyecto de salud</span>
          <h2 id="vodev-partners-title">Clínicas que trabajan con VODEV</h2>
          <p>Un ejemplo de cómo adaptamos la tecnología a un sector concreto.</p>
        </div>
        {clinicas.length > 0 ? <div className="vodev-partner-grid">
          {clinicas.map((clinica) => <div className="vodev-partner" key={clinica.id}>
            {clinica.logo_ruta ? <img src={urlMarca(clinica.logo_ruta)} alt={`Logo de ${clinica.nombre}`} loading="lazy" />
              : <span className="vodev-partner-placeholder" aria-hidden="true">{clinica.nombre.charAt(0)}</span>}
            <strong>{clinica.nombre}</strong>
          </div>)}
        </div> : <p className="vodev-empty">Próximamente conocerás a las clínicas que trabajan con VODEV.</p>}
      </section>
      <footer className="vodev-footer"><strong>VODEV</strong><span>Desarrollo de software para empresas que quieren avanzar.</span></footer>
    </main>
  );
}

function Creador() {
  const navigate = useNavigate();
  const [autorizado, setAutorizado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clinicas, setClinicas] = useState([]);
  const [cuentasWhatsApp, setCuentasWhatsApp] = useState({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [form, setForm] = useState(formularioClinicaVacio);
  const [logoArchivo, setLogoArchivo] = useState(null);
  const [mensajeAlta, setMensajeAlta] = useState('');
  const [creando, setCreando] = useState(false);
  const logoInput = useRef(null);
  const [usuarioForm, setUsuarioForm] = useState({ clinica_id: '', email: '', password: '', role: 'master_admin' });
  const [mensaje, setMensaje] = useState('');

  const cargarClinicas = async () => {
    const { data, error } = await supabase.from('clinicas').select('*').order('created_at');
    if (!error) setClinicas(data || []);
    const { data: cuentas } = await supabase.from('whatsapp_cuentas')
      .select('clinica_id, phone_number_id, activa');
    if (cuentas) setCuentasWhatsApp(Object.fromEntries(cuentas.map((cuenta) => [cuenta.clinica_id, cuenta])));
  };

  const comprobar = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) { setAutorizado(false); setLoading(false); return; }
    const { data } = await supabase.from('app_profiles')
      .select('plataforma_admin, active').eq('id', sessionData.session.user.id).maybeSingle();
    setAutorizado(data?.active === true && data.plataforma_admin === true);
    setLoading(false);
  };

  useEffect(() => {
    comprobar();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setAutorizado(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (autorizado) cargarClinicas(); }, [autorizado]);

  const entrar = async (event) => {
    event.preventDefault();
    setMensaje('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMensaje('No se pudo iniciar sesión.');
    else await comprobar();
  };

  const crear = async (event) => {
    event.preventDefault();
    setMensajeAlta('');
    const slug = form.slug.trim().toLowerCase();
    if (!/^clinica-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setMensajeAlta('La ruta debe comenzar con clinica- y usar letras minúsculas o guiones.');
      return;
    }
    const mapa = normalizarMapa(form.mapa_url);
    if (mapa.error) {
      setMensajeAlta(mapa.error);
      return;
    }
    const imagenInvalida = errorImagen(logoArchivo);
    if (imagenInvalida) { setMensajeAlta(imagenInvalida); return; }
    setCreando(true);
    try {
      const { data: clinica, error } = await supabase.from('clinicas').insert({
        ...form, ...mapa, slug,
        telefono_whatsapp: form.telefono_whatsapp.replace(/\D/g, '')
      }).select('id, logo_ruta').single();
      if (error) {
        setMensajeAlta(error.code === '23505' ? 'Ya existe una clínica con esa ruta. Elige otra.' : error.message);
        return;
      }
      const errorLogo = logoArchivo ? await guardarImagen(clinica, logoArchivo, 'logo') : '';
      setForm(formularioClinicaVacio);
      setLogoArchivo(null);
      if (logoInput.current) logoInput.current.value = '';
      setMensajeAlta(errorLogo
        ? `Clínica creada, pero no se pudo guardar el logo: ${errorLogo}. Puedes subirlo desde la ficha de la clínica.`
        : 'Clínica creada. Ahora puedes dar de alta a su administrador maestro.');
      await cargarClinicas();
    } catch {
      setMensajeAlta('No se pudo completar el alta. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setCreando(false);
    }
  };

  const guardarImagen = async (clinica, archivo, tipo) => {
    const extension = extensionesImagen[archivo.type];
    const ruta = `${clinica.id}/${tipo}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('clinica-branding').upload(ruta, archivo);
    if (uploadError) return uploadError.message;
    const cambio = tipo === 'logo'
      ? { logo_ruta: ruta }
      : { banner_rutas: [...(clinica.banner_rutas || []), ruta] };
    const { error } = await supabase.from('clinicas').update(cambio).eq('id', clinica.id);
    if (error) {
      await supabase.storage.from('clinica-branding').remove([ruta]);
      return error.message;
    }
    if (tipo === 'logo' && clinica.logo_ruta) {
      await supabase.storage.from('clinica-branding').remove([clinica.logo_ruta]);
    }
    return '';
  };

  const subirImagen = async (clinica, archivo, tipo) => {
    if (!archivo) return;
    const imagenInvalida = errorImagen(archivo);
    if (imagenInvalida) { setMensaje(imagenInvalida); return; }
    const error = await guardarImagen(clinica, archivo, tipo);
    setMensaje(error || 'Imagen guardada.');
    if (!error) cargarClinicas();
  };

  const guardarClinica = async (event, clinica) => {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    const cambio = Object.fromEntries(
      ['nombre', 'subtitulo', 'telefono_whatsapp', 'direccion', 'mapa_url']
        .map((campo) => [campo, String(datos.get(campo) || '').trim()])
    );
    const mapa = normalizarMapa(cambio.mapa_url, clinica);
    if (mapa.error) {
      setMensaje(mapa.error);
      return;
    }
    Object.assign(cambio, mapa);
    cambio.telefono_whatsapp = cambio.telefono_whatsapp.replace(/\D/g, '');
    const { error } = await supabase.from('clinicas').update(cambio).eq('id', clinica.id);
    setMensaje(error ? error.message : 'Datos de la clínica actualizados.');
    if (!error) cargarClinicas();
  };

  const quitarBanner = async (clinica, ruta) => {
    const rutas = (clinica.banner_rutas || []).filter((item) => item !== ruta);
    const { error } = await supabase.from('clinicas')
      .update({ banner_rutas: rutas }).eq('id', clinica.id);
    if (error) { setMensaje(error.message); return; }
    await supabase.storage.from('clinica-branding').remove([ruta]);
    setMensaje('Imagen retirada del carrusel.');
    cargarClinicas();
  };

  const guardarWhatsApp = async (event, clinicaId) => {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    const phoneId = String(datos.get('phone_number_id') || '').trim();
    const activa = datos.get('activa') === 'on';
    if ((phoneId && !/^[0-9]{5,30}$/.test(phoneId)) || (activa && !phoneId)) {
      setMensaje('El Phone Number ID de Meta debe contener solo dígitos antes de activar la bandeja.');
      return;
    }
    const { error } = await supabase.from('whatsapp_cuentas').upsert({
      clinica_id: clinicaId,
      phone_number_id: phoneId || null,
      activa
    }, { onConflict: 'clinica_id' });
    setMensaje(error ? error.message : 'Configuración de WhatsApp guardada.');
    if (!error) cargarClinicas();
  };

  const crearUsuario = async (event) => {
    event.preventDefault();
    setMensaje('');
    const { data, error } = await supabase.functions.invoke('crear-usuario-admin', {
      body: { action: 'create_user', ...usuarioForm }
    });
    if (error || data?.error) {
      setMensaje(data?.error || error?.message || 'No se pudo crear el usuario.');
      return;
    }
    setUsuarioForm({ clinica_id: '', email: '', password: '', role: 'master_admin' });
    setMensaje('Usuario creado y vinculado a la clínica seleccionada.');
  };

  if (loading) return <p className="auth-loading">Verificando acceso...</p>;

  if (!autorizado) return (
    <main className="container platform-page">
      <Link to="/">Volver a VODEV</Link>
      <h1>Acceso del creador</h1>
      <form className="form platform-form" onSubmit={entrar}>
        <label>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <button type="submit">Entrar</button>
      </form>
      {mensaje && <p role="alert">{mensaje}</p>}
    </main>
  );

  return (
    <main className="container platform-page">
      <div className="platform-heading">
        <div><h1>Panel VODEV</h1><p>Alta y configuración de clínicas.</p></div>
        <button type="button" onClick={async () => { await supabase.auth.signOut(); navigate('/'); }}>Cerrar sesión</button>
      </div>
      {mensaje && <p role="status">{mensaje}</p>}
      <section className="dashboard-section">
        <h2>Nueva clínica</h2>
        <form className="form platform-form" onSubmit={crear}>
          <label>Ruta<input value={form.slug} placeholder="clinica-evocare" onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></label>
          <label>Nombre<input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required /></label>
          <label>Subtítulo<input value={form.subtitulo} onChange={(e) => setForm({ ...form, subtitulo: e.target.value })} /></label>
          <label>WhatsApp<input value={form.telefono_whatsapp} onChange={(e) => setForm({ ...form, telefono_whatsapp: e.target.value })} /></label>
          <label>Dirección<input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></label>
          <label>Enlace de Google Maps<input type="url" value={form.mapa_url} onChange={(e) => setForm({ ...form, mapa_url: e.target.value })} placeholder="https://maps.app.goo.gl/..." /></label>
          <small className="platform-field-help">Con un enlace corto, el mapa en la página se muestra a partir de la dirección. Comprueba que la dirección sea correcta.</small>
          <label>Logo de la clínica (opcional)<input ref={logoInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setLogoArchivo(e.target.files[0] || null)} /></label>
          <small className="platform-field-help">Imagen JPG, PNG o WebP de hasta 8 MB. También podrás cambiarla después.</small>
          <button type="submit" disabled={creando}>{creando ? 'Creando clínica...' : 'Crear clínica'}</button>
          {mensajeAlta && <p className="platform-form-message" role="status">{mensajeAlta}</p>}
        </form>
      </section>
      <section className="dashboard-section">
        <h2>Nuevo usuario de clínica</h2>
        <form className="form platform-form" onSubmit={crearUsuario}>
          <label>Clínica
            <select value={usuarioForm.clinica_id} onChange={(e) => setUsuarioForm({ ...usuarioForm, clinica_id: e.target.value })} required>
              <option value="">Selecciona una clínica</option>
              {clinicas.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </label>
          <label>Correo<input type="email" value={usuarioForm.email} onChange={(e) => setUsuarioForm({ ...usuarioForm, email: e.target.value })} required /></label>
          <label>Contraseña temporal<input type="password" minLength={8} value={usuarioForm.password} onChange={(e) => setUsuarioForm({ ...usuarioForm, password: e.target.value })} required /></label>
          <label>Rol
            <select value={usuarioForm.role} onChange={(e) => setUsuarioForm({ ...usuarioForm, role: e.target.value })}>
              <option value="master_admin">Administrador maestro de la clínica</option>
              <option value="admin">Administrador</option>
              <option value="user">Solo lectura</option>
            </select>
          </label>
          <button type="submit">Crear usuario</button>
        </form>
      </section>
      <div className="platform-grid">
        {clinicas.map((clinica) => (
          <section className="dashboard-section platform-card" key={clinica.id}>
            {clinica.logo_ruta && <img src={urlMarca(clinica.logo_ruta)} alt="" />}
            <h2>{clinica.nombre}</h2>
            <a href={`/${clinica.slug}/`}>Abrir sitio</a>
            <form className="platform-form" key={`${clinica.nombre}-${clinica.subtitulo}-${clinica.telefono_whatsapp}-${clinica.direccion}-${clinica.mapa_url}-${clinica.mapa_embed_url}`} onSubmit={(event) => guardarClinica(event, clinica)}>
              <label>Nombre<input name="nombre" defaultValue={clinica.nombre} required /></label>
              <label>Subtítulo<input name="subtitulo" defaultValue={clinica.subtitulo || ''} /></label>
              <label>WhatsApp<input name="telefono_whatsapp" defaultValue={clinica.telefono_whatsapp || ''} /></label>
              <label>Dirección<input name="direccion" defaultValue={clinica.direccion || ''} /></label>
              <label>Enlace de Google Maps<input name="mapa_url" type="url" defaultValue={clinica.mapa_url || clinica.mapa_embed_url || ''} placeholder="https://maps.app.goo.gl/..." /></label>
              <button type="submit">Guardar datos</button>
            </form>
            <form className="platform-form platform-whatsapp-setup" key={`wa-${clinica.id}-${cuentasWhatsApp[clinica.id]?.phone_number_id || ''}-${cuentasWhatsApp[clinica.id]?.activa || false}`} onSubmit={(event) => guardarWhatsApp(event, clinica.id)}>
              <h3>Bandeja de WhatsApp</h3>
              <p>Primero conecta el número de esta clínica a WhatsApp Cloud API. No pegues aquí el token secreto.</p>
              <label>Phone Number ID de Meta<input name="phone_number_id" inputMode="numeric" defaultValue={cuentasWhatsApp[clinica.id]?.phone_number_id || ''} placeholder="ID asignado por Meta" /></label>
              <label className="platform-checkbox"><input type="checkbox" name="activa" defaultChecked={cuentasWhatsApp[clinica.id]?.activa || false} /> Habilitar bandeja después de configurar Meta y el token en Supabase</label>
              <button type="submit">Guardar conexión</button>
            </form>
            <label>Logo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => subirImagen(clinica, e.target.files[0], 'logo')} /></label>
            <label>Imagen del carrusel<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => subirImagen(clinica, e.target.files[0], 'banner')} /></label>
            {(clinica.banner_rutas || []).map((ruta) => <div className="platform-banner" key={ruta}>
              <img src={urlMarca(ruta)} alt="Imagen del carrusel" />
              <button type="button" onClick={() => quitarBanner(clinica, ruta)}>Quitar imagen</button>
            </div>)}
          </section>
        ))}
      </div>
    </main>
  );
}

export default function PlatformApp() {
  const [theme, setTheme] = useState(() => (
    window.localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  ));

  useEffect(() => {
    document.documentElement.dataset.site = 'platform';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('theme', theme);
    return () => { delete document.documentElement.dataset.site; };
  }, [theme]);

  return <>
    <nav className="navbar platform-navbar">
      <Link to="/" className="brand vodev-brand"><strong>VODEV</strong></Link>
      <ThemeToggle theme={theme} onToggle={() => setTheme((actual) => actual === 'dark' ? 'light' : 'dark')} />
    </nav>
    <Routes>
      <Route path="/" element={<VodevHome />} />
      <Route path="/plataforma" element={<Creador />} />
      <Route path="/admin/*" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/agendar" element={<Navigate to="/" replace />} />
      <Route path="/galeria" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>;
}
