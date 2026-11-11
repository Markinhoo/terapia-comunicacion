import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createAdminClient } from '../_shared/whatsapp.ts';
import { validSignature } from '../_shared/whatsapp-signature.mjs';

serve(async (req) => {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const token = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
    const valid = token && url.searchParams.get('hub.mode') === 'subscribe'
      && url.searchParams.get('hub.verify_token') === token;
    return valid
      ? new Response(url.searchParams.get('hub.challenge') || '', { status: 200 })
      : new Response('No autorizado', { status: 403 });
  }
  if (req.method !== 'POST') return new Response('Método no permitido', { status: 405 });

  const secret = Deno.env.get('WHATSAPP_APP_SECRET');
  if (!secret) return new Response('Integración no configurada', { status: 503 });

  const body = await req.text();
  if (body.length > 1_000_000) return new Response('Carga demasiado grande', { status: 413 });
  if (!(await validSignature(body, req.headers.get('x-hub-signature-256'), secret))) {
    return new Response('Firma no válida', { status: 403 });
  }

  try {
    const payload = JSON.parse(body);
    if (payload.object !== 'whatsapp_business_account') return new Response('ok');
    const admin = createAdminClient();

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        const phoneId = String(value.metadata?.phone_number_id || '');
        if (!phoneId) continue;
        const { data: account, error: accountError } = await admin.from('whatsapp_cuentas')
          .select('clinica_id').eq('phone_number_id', phoneId).eq('activa', true).maybeSingle();
        if (accountError) throw accountError;
        if (!account) continue;

        for (const message of value.messages || []) {
          const waId = String(message.from || '');
          const wamid = String(message.id || '');
          if (!/^[0-9]{8,20}$/.test(waId) || !wamid) continue;
          const contact = (value.contacts || []).find((item: { wa_id: string }) => item.wa_id === waId);
          const timestamp = Number(message.timestamp);
          const createdAt = Number.isFinite(timestamp) && timestamp > 0
            ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();
          const { data: conversation, error: conversationError } = await admin
            .from('whatsapp_conversaciones').upsert({
              clinica_id: account.clinica_id,
              wa_id: waId,
              nombre_contacto: String(contact?.profile?.name || waId).slice(0, 150),
              ultimo_mensaje_at: createdAt,
              ultima_entrada_at: createdAt
            }, { onConflict: 'clinica_id,wa_id' }).select('id').single();
          if (conversationError) throw conversationError;

          const type = String(message.type || 'unknown');
          const bodyText = type === 'text' ? String(message.text?.body || '') : `[${type}]`;
          const { error: messageError } = await admin.from('whatsapp_mensajes').upsert({
            clinica_id: account.clinica_id,
            conversacion_id: conversation.id,
            wamid,
            direccion: 'entrante',
            tipo: type.slice(0, 32),
            cuerpo: bodyText.slice(0, 4096),
            estado: 'recibido',
            created_at: createdAt
          }, { onConflict: 'wamid', ignoreDuplicates: true });
          if (messageError) throw messageError;
        }

        for (const status of value.statuses || []) {
          const estado = { sent: 'enviado', delivered: 'entregado', read: 'leido', failed: 'fallido' }
            [String(status.status) as 'sent' | 'delivered' | 'read' | 'failed'];
          if (!estado || !status.id) continue;
          const { error } = await admin.from('whatsapp_mensajes').update({ estado })
            .eq('clinica_id', account.clinica_id).eq('wamid', String(status.id)).eq('direccion', 'saliente');
          if (error) throw error;
        }
      }
    }
    return new Response('ok', { status: 200 });
  } catch (error) {
    console.error('WhatsApp webhook:', error);
    return new Response('No se pudo procesar el evento', { status: 500 });
  }
});
