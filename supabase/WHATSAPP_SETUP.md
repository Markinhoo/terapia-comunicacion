# Bandeja de WhatsApp por clínica

La bandeja queda inactiva hasta conectar cada número a WhatsApp Cloud API. El número
visible al público (`clinicas.telefono_whatsapp`) no es el `Phone Number ID` de Meta.
El uso de la aplicación WhatsApp Business por sí solo no entrega mensajes al CRM.

## Preparación

1. Ejecuta `migrations/20261111_whatsapp_inbox.sql` en Supabase después de las
   migraciones multiclinica. No contiene números ni tokens.
2. Configura tu aplicación de Meta y el número de cada clínica en WhatsApp
   Business Platform. Obtén el `Phone Number ID` de cada número y un token con
   permisos de mensajería para esa cuenta. Verifica en Meta las condiciones para
   usar el número que ya tienes en la aplicación WhatsApp Business.
3. Configura como secretos de Edge Functions `WHATSAPP_VERIFY_TOKEN` (valor largo
   aleatorio), `WHATSAPP_APP_SECRET` (secreto de la aplicación Meta),
   `WHATSAPP_GRAPH_VERSION` (versión vigente, por ejemplo `v23.0`) y un
   `WHATSAPP_TOKEN_<Phone Number ID>` por clínica. Ejemplo de **nombre** del
   secreto: `WHATSAPP_TOKEN_123456789012345`. Nunca pongas esos valores en Vercel,
   en variables `VITE_`, en el formulario web ni en Git.
4. Despliega `whatsapp-webhook` sin verificación JWT de Supabase (el archivo
   `config.toml` ya lo indica) y `whatsapp-enviar` con verificación JWT activada.
   Con Supabase CLI: `npx supabase functions deploy whatsapp-webhook --no-verify-jwt`
   y `npx supabase functions deploy whatsapp-enviar`.
5. En Meta registra como URL de callback
   `https://<PROJECT_REF>.supabase.co/functions/v1/whatsapp-webhook`, usa el mismo
   `WHATSAPP_VERIFY_TOKEN` y suscribe el campo `messages`. El webhook POST exige
   la firma `X-Hub-Signature-256` calculada con `WHATSAPP_APP_SECRET`.
6. En `/plataforma`, abre la ficha de cada clínica. Guarda su número público en
   WhatsApp y su `Phone Number ID` en "Bandeja de WhatsApp". Activa la bandeja
   después de configurar Meta y los secretos; entonces prueba un mensaje
   entrante y una respuesta con ese número.

La sección `/<slug-de-clinica>/admin/whatsapp` muestra únicamente las conversaciones de la
clínica del administrador. Por seguridad, solo permite responder durante las
24 horas posteriores al último mensaje entrante. Para iniciar o retomar una
conversación fuera de ese plazo hacen falta plantillas aprobadas por Meta; esta
versión todavía no envía plantillas. Los mensajes multimedia aparecen como
marcadores de tipo, no se descargan automáticamente al expediente.

El webhook y el envío usan credenciales de servidor. La base de datos aplica RLS
para impedir que un administrador vea conversaciones de otra clínica. Antes de
activar números reales, prueba el flujo completo en un proyecto no productivo
y revisa las políticas de privacidad y retención de datos de cada clínica.
