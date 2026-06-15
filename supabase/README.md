# Seguridad de Supabase

## Migraciones

Ejecuta primero la consulta de diagnostico incluida en
`migrations/20260615_unique_appointment_slot.sql`. Si no devuelve filas,
puedes aplicar la migracion para impedir dos citas activas en el mismo horario.

## Agenda publica segura

Aplica `migrations/20260615_secure_public_scheduling.sql` despues de publicar
el frontend que usa `registrar_cita_publica`.

La migracion:

1. Crea una funcion transaccional para buscar o crear al paciente y registrar
   su cita.
2. Valida fecha, horario, telefono, correo, edad y servicio en el servidor.
3. Bloquea reservas simultaneas y citas que se solapen.
4. Mantiene la consulta publica de horarios mediante una funcion
   `security definer`.
5. Elimina las politicas que permitian a visitantes leer todos los pacientes
   y todas las citas.

Despues de aplicarla, el rol `anon` no debe tener politicas directas sobre
`public.pacientes` ni `public.citas`.

Verifica el resultado con:

```sql
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('pacientes', 'citas')
order by tablename, policyname;
```

Solo deben aparecer las politicas administrativas para `authenticated`.

## Error `relation "citas" does not exist`

Si existen triggers antiguos que usan nombres de tabla sin esquema, aplica
`migrations/20260615_fix_scheduling_search_path.sql`. La funcion mantiene
`pg_catalog` como primer esquema y permite que esos triggers resuelvan las
tablas de `public`.

El bucket `expedientes` debe ser privado y sus politicas de objetos deben
limitar lectura, escritura y borrado a usuarios autenticados.

## Control de sesiones y reglamento

Aplica `migrations/20260615_patient_tracking_and_location.sql` antes de
publicar el formulario ampliado.

La migracion agrega:

- Datos de la hoja de localizacion en `pacientes`.
- La tabla `sesiones_paciente` para terapia, reagenda, pago, cantidad y firma.
- La tabla `envios_reglamento`, que crea un envio pendiente solo para la
  primera cita de cada paciente.
- La funcion publica `registrar_cita_publica_v2`.

## Programacion de citas desde administracion

Ejecuta tambien:

`supabase/migrations/20260615_admin_patient_scheduling.sql`

Esta migracion agrega dos funciones exclusivas para usuarios autenticados:

- `programar_citas_paciente`: registra varias citas acordadas con un paciente y
  vuelve a comprobar que cada horario siga libre antes de guardar.
- `eliminar_paciente_admin`: elimina al paciente y sus citas, sesiones, pagos,
  firmas y registros pendientes de envio.

Los horarios programados dejan de aparecer como disponibles porque
`obtener_horarios_disponibles` considera todas las citas cuyo estatus no sea
`Cancelada`.

### Envio real del reglamento

La cola no envia mensajes por si sola. Para correo se necesita una Supabase
Edge Function y un proveedor como Resend. La funcion debe:

1. Leer filas `pendiente` de `envios_reglamento`.
2. Adjuntar o enlazar el reglamento almacenado en un bucket privado.
3. Enviar al campo `destinatario`.
4. Marcar `estado = 'enviado'` y guardar `enviado_at`.
5. Registrar errores e incrementar `intentos`.

Para WhatsApp se requiere la API oficial de WhatsApp Business o un proveedor
autorizado; un enlace `wa.me` no puede enviar documentos automaticamente.
