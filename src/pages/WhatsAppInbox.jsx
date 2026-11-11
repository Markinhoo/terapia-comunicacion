import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useClinica } from '../contexts/clinica';

const formatearHora = (valor) => valor
  ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor))
  : '';

function WhatsAppInbox() {
  const clinica = useClinica();
  const [cuenta, setCuenta] = useState(null);
  const [conversaciones, setConversaciones] = useState([]);
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargarConversaciones = useCallback(async () => {
    const { data, error: queryError } = await supabase.from('whatsapp_conversaciones')
      .select('id, wa_id, nombre_contacto, ultimo_mensaje_at, ultima_entrada_at')
      .eq('clinica_id', clinica.id).order('ultimo_mensaje_at', { ascending: false }).limit(100);
    if (queryError) { setError(queryError.message); return; }
    setConversaciones(data || []);
  }, [clinica.id]);

  const cargarMensajes = useCallback(async () => {
    if (!seleccionadaId) return;
    const { data, error: queryError } = await supabase.from('whatsapp_mensajes')
      .select('id, direccion, tipo, cuerpo, estado, created_at')
      .eq('clinica_id', clinica.id).eq('conversacion_id', seleccionadaId)
      .order('created_at', { ascending: false }).limit(100);
    if (queryError) { setError(queryError.message); return; }
    setMensajes((data || []).reverse());
  }, [clinica.id, seleccionadaId]);

  useEffect(() => {
    supabase.from('whatsapp_cuentas').select('phone_number_id, activa')
      .eq('clinica_id', clinica.id).maybeSingle()
      .then(({ data, error: queryError }) => {
        if (queryError) setError(queryError.message);
        else setCuenta(data);
      });
  }, [clinica.id]);

  useEffect(() => {
    cargarConversaciones();
    const timer = window.setInterval(cargarConversaciones, 15000);
    return () => window.clearInterval(timer);
  }, [cargarConversaciones]);

  useEffect(() => {
    setMensajes([]);
    cargarMensajes();
    const timer = window.setInterval(cargarMensajes, 10000);
    return () => window.clearInterval(timer);
  }, [cargarMensajes]);

  useEffect(() => {
    const timer = window.setInterval(() => setAhora(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const seleccionada = conversaciones.find((item) => item.id === seleccionadaId);
  const puedeResponder = cuenta?.activa && seleccionada?.ultima_entrada_at
    && ahora - Date.parse(seleccionada.ultima_entrada_at) < 24 * 60 * 60 * 1000;
  const filtradas = useMemo(() => conversaciones.filter((item) =>
    `${item.nombre_contacto} ${item.wa_id}`.toLowerCase().includes(busqueda.toLowerCase().trim())
  ), [busqueda, conversaciones]);

  const enviar = async (event) => {
    event.preventDefault();
    if (!seleccionadaId || !texto.trim() || enviando) return;
    setEnviando(true);
    setError('');
    setAviso('');
    const { data, error: sendError } = await supabase.functions.invoke('whatsapp-enviar', {
      body: { conversacion_id: seleccionadaId, texto: texto.trim() }
    });
    if (sendError || data?.error) {
      let detail = data?.error;
      if (!detail && sendError?.context?.json) {
        try { detail = (await sendError.context.json()).error; } catch { /* Sin detalle del servidor. */ }
      }
      setError(detail || 'No se pudo enviar el mensaje.');
    } else {
      setTexto('');
      if (data?.advertencia) setAviso(data.advertencia);
      await cargarMensajes();
      await cargarConversaciones();
    }
    setEnviando(false);
  };

  return <section className="whatsapp-inbox">
    <header className="whatsapp-inbox-heading">
      <h1>WhatsApp de {clinica.nombre}</h1>
      <p>Conversaciones privadas de esta clínica.</p>
    </header>
    {!cuenta?.activa && <div className="whatsapp-inbox-notice" role="status">
      La bandeja aún no está conectada. El administrador de la plataforma debe registrar el Phone Number ID de Meta, configurar su token en Supabase y habilitarla.
    </div>}
    {error && <p className="whatsapp-inbox-error" role="alert">{error}</p>}
    {aviso && <p className="whatsapp-inbox-notice" role="status">{aviso}</p>}
    <div className="whatsapp-inbox-layout">
      <aside className="whatsapp-conversations" aria-label="Conversaciones">
        <label>Buscar conversación
          <input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Nombre o teléfono" />
        </label>
        {filtradas.length === 0 && <p className="whatsapp-empty">Aún no hay conversaciones.</p>}
        {filtradas.map((item) => <button type="button" key={item.id}
          className={item.id === seleccionadaId ? 'whatsapp-conversation active' : 'whatsapp-conversation'}
          onClick={() => setSeleccionadaId(item.id)}>
          <strong>{item.nombre_contacto || item.wa_id}</strong>
          <span>{item.wa_id}</span>
          <small>{formatearHora(item.ultimo_mensaje_at)}</small>
        </button>)}
      </aside>
      <div className="whatsapp-thread">
        {!seleccionada ? <p className="whatsapp-empty">Selecciona una conversación para ver los mensajes.</p> : <>
          <div className="whatsapp-thread-heading">
            <strong>{seleccionada.nombre_contacto || seleccionada.wa_id}</strong>
            <small>{seleccionada.wa_id}</small>
          </div>
          <div className="whatsapp-messages" role="log" aria-label="Mensajes">
            {mensajes.map((item) => <div className={`whatsapp-message ${item.direccion}`} key={item.id}>
              <p>{item.cuerpo}</p>
              <small>{formatearHora(item.created_at)} · {item.estado}</small>
            </div>)}
          </div>
          <form className="whatsapp-composer" onSubmit={enviar}>
            <label htmlFor="whatsapp-texto">Responder</label>
            <textarea id="whatsapp-texto" value={texto} onChange={(event) => setTexto(event.target.value)}
              disabled={!puedeResponder || enviando} maxLength={4096} rows={3}
              placeholder={puedeResponder ? 'Escribe una respuesta...' : 'Espera un mensaje nuevo del paciente para responder.'} />
            {!puedeResponder && <small>Fuera de la ventana de 24 horas se necesita una plantilla aprobada por Meta.</small>}
            <button type="submit" disabled={!puedeResponder || !texto.trim() || enviando}>{enviando ? 'Enviando...' : 'Enviar'}</button>
          </form>
        </>}
      </div>
    </div>
  </section>;
}

export default WhatsAppInbox;
