create or replace function public.programar_citas_paciente(
  p_paciente_id bigint,
  p_servicio text,
  p_motivo_consulta text,
  p_citas jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_paciente public.pacientes%rowtype;
  v_item jsonb;
  v_fecha date;
  v_hora time without time zone;
  v_ids bigint[] := array[]::bigint[];
  v_cita_id bigint;
  v_hoy date := (current_timestamp at time zone 'America/Mexico_City')::date;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Debes iniciar sesion como administrador.';
  end if;

  select *
  into v_paciente
  from public.pacientes
  where id = p_paciente_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'El paciente no existe.';
  end if;

  if p_citas is null
     or jsonb_typeof(p_citas) <> 'array'
     or jsonb_array_length(p_citas) = 0 then
    raise exception using errcode = '22023', message = 'Agrega al menos una fecha y hora.';
  end if;

  for v_item in select value from jsonb_array_elements(p_citas)
  loop
    v_fecha := (v_item ->> 'fecha')::date;
    v_hora := (v_item ->> 'hora')::time;

    if v_fecha < v_hoy or extract(isodow from v_fecha) not between 1 and 6 then
      raise exception using
        errcode = '22023',
        message = format('La fecha %s no esta disponible.', v_fecha);
    end if;

    if v_hora < time '09:00'
       or v_hora > time '13:00'
       or extract(minute from v_hora)::integer % 30 <> 0
       or extract(second from v_hora) <> 0 then
      raise exception using
        errcode = '22023',
        message = format('La hora %s no es valida.', v_hora);
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_fecha::text));

    if exists (
      select 1
      from public.citas
      where fecha = v_fecha
        and estatus is distinct from 'Cancelada'
        and v_hora < hora + interval '1 hour'
        and v_hora + interval '1 hour' > hora
    ) then
      raise exception using
        errcode = '23P01',
        message = format(
          'El horario del %s a las %s ya no esta disponible.',
          v_fecha,
          to_char(v_hora, 'HH24:MI')
        );
    end if;

    insert into public.citas (
      nombre_paciente,
      edad,
      nombre_responsable,
      telefono,
      correo,
      servicio,
      modalidad,
      fecha,
      hora,
      motivo_consulta,
      estatus,
      confirmado,
      primera_consulta,
      paciente_id
    )
    values (
      v_paciente.nombre_paciente,
      v_paciente.edad,
      v_paciente.nombre_responsable,
      v_paciente.telefono,
      v_paciente.correo,
      p_servicio,
      'Presencial',
      v_fecha,
      v_hora,
      nullif(trim(coalesce(p_motivo_consulta, '')), ''),
      'Confirmada',
      true,
      false,
      v_paciente.id
    )
    returning id into v_cita_id;

    v_ids := array_append(v_ids, v_cita_id);
  end loop;

  return jsonb_build_object(
    'paciente_id', v_paciente.id,
    'citas_creadas', coalesce(array_length(v_ids, 1), 0),
    'cita_ids', to_jsonb(v_ids)
  );
end;
$function$;

revoke all on function public.programar_citas_paciente(bigint, text, text, jsonb)
from public;

grant execute on function public.programar_citas_paciente(bigint, text, text, jsonb)
to authenticated;

create or replace function public.eliminar_paciente_admin(p_paciente_id bigint)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Debes iniciar sesion como administrador.';
  end if;

  delete from public.envios_reglamento where paciente_id = p_paciente_id;
  delete from public.sesiones_paciente where paciente_id = p_paciente_id;
  delete from public.citas where paciente_id = p_paciente_id;
  delete from public.pacientes where id = p_paciente_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'El paciente no existe.';
  end if;
end;
$function$;

revoke all on function public.eliminar_paciente_admin(bigint) from public;
grant execute on function public.eliminar_paciente_admin(bigint) to authenticated;
