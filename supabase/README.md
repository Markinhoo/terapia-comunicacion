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

El bucket `expedientes` debe ser privado y sus politicas de objetos deben
limitar lectura, escritura y borrado a usuarios autenticados.
