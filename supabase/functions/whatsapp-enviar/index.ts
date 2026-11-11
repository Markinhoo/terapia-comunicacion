import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createAdminClient, createCallerClient } from '../_shared/whatsapp.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: cors });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  try {
    const authorization = req.headers.get('Authorization') || '';
    if (!authorization.startsWith('Bearer ')) return json({ error: 'Inicia sesión.' }, 401);
    const caller = createCallerClient(authorization);
    const { data: userData, error: authError } = await caller.auth.getUser();
    if (authError || !userData.user) return json({ error: 'Sesión no válida.' }, 401);

    const { data: profile, error: profileError } = await caller.from('app_profiles')
      .select('clinica_id, role, active').eq('id', userData.user.id).maybeSingle();
    if (profileError || !profile?.active || !profile.clinica_id ||
      !['master_admin', 'admin'].includes(profile.role)) {
      return json({ error: 'No puedes enviar mensajes de esta clínica.' }, 403);
    }

    const input = await req.json();
    const conversationId = Number(input.conversacion_id);
    const text = String(input.texto || '').trim();
    if (!Number.isSafeInteger(conversationId) || conversationId < 1 || !text || text.length > 4096) {
      return json({ error: 'Selecciona una conversación y escribe hasta 4096 caracteres.' }, 400);
    }

    const admin = createAdminClient();
    const { data: conversation, error: conversationError } = await admin
      .from('whatsapp_conversaciones')
      .select('id, clinica_id, wa_id, ultima_entrada_at')
      .eq('id', conversationId).eq('clinica_id', profile.clinica_id).maybeSingle();
    if (conversationError || !conversation) return json({ error: 'Conversación no disponible.' }, 404);

    const lastInbound = Date.parse(conversation.ultima_entrada_at || '');
    if (!Number.isFinite(lastInbound) || Date.now() - lastInbound >= 24 * 60 * 60 * 1000) {
      return json({ error: 'La ventana de atención venció. Para volver a escribir se necesita una plantilla aprobada por Meta.' }, 409);
    }

    const { data: account, error: accountError } = await admin.from('whatsapp_cuentas')
      .select('phone_number_id').eq('clinica_id', profile.clinica_id).eq('activa', true).maybeSingle();
    if (accountError || !account?.phone_number_id) {
      return json({ error: 'WhatsApp todavía no está conectado para esta clínica.' }, 503);
    }
    const phoneId = account.phone_number_id;
    const token = Deno.env.get(`WHATSAPP_TOKEN_${phoneId}`);
    const version = Deno.env.get('WHATSAPP_GRAPH_VERSION');
    if (!token || !version || !/^v[0-9]+\.[0-9]+$/.test(version)) {
      return json({ error: 'Falta configurar el token o la versión de Meta para esta clínica.' }, 503);
    }

    const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: conversation.wa_id,
        type: 'text',
        text: { body: text }
      })
    });
    const result = await response.json();
    const wamid = String(result.messages?.[0]?.id || '');
    if (!response.ok || !wamid) {
      console.error('Meta rechazó el envío:', response.status, result.error?.code);
      return json({ error: 'Meta no aceptó el mensaje. Revisa la conexión y la ventana de atención.' }, 502);
    }

    const { error: saveError } = await admin.from('whatsapp_mensajes').insert({
      clinica_id: profile.clinica_id,
      conversacion_id: conversation.id,
      wamid,
      direccion: 'saliente',
      tipo: 'text',
      cuerpo: text,
      estado: 'enviado'
    });
    if (saveError) {
      console.error('Mensaje enviado pero no guardado:', saveError);
      return json({ enviado: true, advertencia: 'Meta envió el mensaje, pero no se pudo guardar en la bandeja.' });
    }
    const { error: updateError } = await admin.from('whatsapp_conversaciones')
      .update({ ultimo_mensaje_at: new Date().toISOString() })
      .eq('id', conversation.id).eq('clinica_id', profile.clinica_id);
    if (updateError) console.error('No se actualizó el orden de conversaciones:', updateError);
    return json({ enviado: true });
  } catch (error) {
    console.error('WhatsApp enviar:', error);
    return json({ error: 'No se pudo enviar el mensaje.' }, 500);
  }
});
