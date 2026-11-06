# Despliegue multiclínica

La URL pública pasa a ser `/<slug>/`, por ejemplo `/clinica-evocare/`.
El creador inicia sesión en `/plataforma`. Las cuentas clínicas siguen en
`/<slug>/login` o `/<slug>/admin`.

## Antes de publicar

1. Esta puesta en marcha elimina definitivamente los pacientes, citas,
   expedientes, pagos, galería y usuarios de prueba. No se requiere respaldo
   de esos archivos si realmente vas a empezar de cero. No pongas la
   service role key en Vercel ni en ninguna variable `VITE_*`.
2. Comprueba que `markos_ff7@hotmail.com` existe en `app_profiles` como
   `master_admin` activo. La primera migración se cancela sin cambios si no
   encuentra exactamente esa cuenta.
3. Ejecuta `manual/limpiar_datos_prueba.sql` antes de las migraciones para
   borrar todos los datos clínicos, financieros, galería, invitaciones y
   bitácora de prueba. Es irreversible. El script comprueba que el creador
   existe y, si ya existe `clinicas`, exige que Evocaré sea la única clínica.
4. Durante una ventana de mantenimiento, aplica en este orden:
   `migrations/20261105_multiclinic_foundation.sql` y
   `migrations/20261105_multiclinic_rpcs.sql`. Evocaré queda creada y vacía.
5. Usa `node scripts/cleanupLegacyStorage.mjs` primero en simulación.
   Con `--delete` elimina los objetos de los buckets antiguos.
6. Usa `node scripts/cleanupLegacyUsers.mjs` primero en simulación y revisa
   la lista. Después, `node scripts/cleanupLegacyUsers.mjs --delete
   --confirm-email=markos_ff7@hotmail.com` elimina todas las cuentas de
   Supabase Auth salvo esa. El script exige que el perfil conservado sea
   `master_admin` activo, `plataforma_admin = true` y sin clínica asignada.
   Ambos scripts requieren `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
   configuradas solo en el entorno local, nunca en el frontend.
7. Despliega de nuevo la Edge Function `crear-usuario-admin` y después el
   frontend en Vercel. No publiques el frontend antes de las migraciones.
8. Desde `/plataforma`, completa nombre, contacto, logo y banners de
   Evocaré. Crea ahí sus nuevos usuarios indicando clínica y rol. Para una
   clínica nueva, crea primero la clínica y después sus usuarios. Cada
   clínica administra sus propios servicios, agenda, pacientes y galería.

## Comprobaciones obligatorias

- Desde una cuenta de una clínica, prueba que IDs de pacientes de otra
  clínica no pueden leerse, modificarse ni descargarse de Storage.
- Dos clínicas deben poder usar la misma fecha y hora sin conflicto.
- Un usuario normal solo consulta inicio y calendario de su clínica.
- Una cuenta administradora de clínica no puede crear usuarios en otra
  clínica ni ver su bitácora.
- Reserva pública y galería deben mostrar solo la clínica de la URL.

No se han aplicado estos cambios a Supabase desde el repositorio. La
validación de SQL y RLS debe realizarse en una copia del proyecto antes
de ejecutarlos en producción.

La cuenta de creador se asigna exclusivamente a `markos_ff7@hotmail.com`
y no pertenece a ninguna clínica. Las demás cuentas se eliminan únicamente
al ejecutar el script de limpieza de usuarios; las migraciones no las borran.
