create or replace function public.obtener_horarios_disponibles(fecha_consulta date)
returns table (
  hora_disponible time without time zone,
  disponible boolean
)
language sql
security definer
set search_path = ''
as $function$
  with horarios as (
    select generate_series(
      fecha_consulta + time '09:00',
      fecha_consulta + time '13:00',
      interval '30 minutes'
    ) as inicio
  ),
  ocupadas as (
    select
      fecha + hora as inicio,
      fecha + hora + interval '1 hour' as fin
    from public.citas
    where fecha = fecha_consulta
      and estatus is distinct from 'Cancelada'
  )
  select
    h.inicio::time as hora_disponible,
    not exists (
      select 1
      from ocupadas o
      where h.inicio < o.fin
        and h.inicio + interval '1 hour' > o.inicio
    ) as disponible
  from horarios h
  where extract(isodow from fecha_consulta) between 1 and 6
  order by h.inicio;
$function$;

create or replace function public.registrar_cita_publica(
  p_nombre_paciente text,
  p_edad integer,
  p_nombre_responsable text,
  p_telefono text,
  p_correo text,
  p_servicio text,
  p_fecha date,
  p_hora time without time zone,
  p_motivo_consulta text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_paciente_id bigint;
  v_cita_id bigint;
  v_hoy date := (current_timestamp at time zone 'America/Mexico_City')::date;
begin
  if length(trim(coalesce(p_nombre_paciente, ''))) < 2 then
    raise exception using
      errcode = '22023',
      message = 'El nombre del paciente no es valido.';
  end if;

  if p_edad is not null and (p_edad < 0 or p_edad > 120) then
    raise exception using
      errcode = '22023',
      message = 'La edad no es valida.';
  end if;

  if coalesce(p_telefono, '') !~ '^[0-9]{10}$' then
    raise exception using
      errcode = '22023',
      message = 'El telefono debe contener 10 digitos.';
  end if;

  if p_correo is not null
     and trim(p_correo) <> ''
     and trim(p_correo) !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception using
      errcode = '22023',
      message = 'El correo no es valido.';
  end if;

  if p_servicio not in (
    'Evaluación inicial',
    'Terapia de lenguaje infantil',
    'Estimulación temprana',
    'Problemas de articulación',
    'Dificultades de lectoescritura',
    'Terapia para adultos',
    'Orientación a padres'
  ) then
    raise exception using
      errcode = '22023',
      message = 'El servicio no es valido.';
  end if;

  if p_fecha < v_hoy
     or extract(isodow from p_fecha) not between 1 and 6 then
    raise exception using
      errcode = '22023',
      message = 'La fecha no esta disponible.';
  end if;

  if p_hora < time '09:00'
     or p_hora > time '13:00'
     or extract(minute from p_hora)::integer % 30 <> 0
     or extract(second from p_hora) <> 0 then
    raise exception using
      errcode = '22023',
      message = 'El horario no es valido.';
  end if;

  -- Serialize reservations for the same date before checking overlaps.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(p_fecha::text)
  );

  if exists (
    select 1
    from public.citas
    where fecha = p_fecha
      and estatus is distinct from 'Cancelada'
      and p_hora < hora + interval '1 hour'
      and p_hora + interval '1 hour' > hora
  ) then
    raise exception using
      errcode = '23P01',
      message = 'El horario ya no esta disponible.';
  end if;

  select id
  into v_paciente_id
  from public.pacientes
  where telefono = p_telefono
    and lower(trim(nombre_paciente)) = lower(trim(p_nombre_paciente))
  order by id
  limit 1;

  if v_paciente_id is null then
    insert into public.pacientes (
      nombre_paciente,
      edad,
      nombre_responsable,
      telefono,
      correo
    )
    values (
      trim(p_nombre_paciente),
      p_edad,
      nullif(trim(coalesce(p_nombre_responsable, '')), ''),
      p_telefono,
      nullif(trim(coalesce(p_correo, '')), '')
    )
    returning id into v_paciente_id;
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
    paciente_id
  )
  values (
    trim(p_nombre_paciente),
    p_edad,
    nullif(trim(coalesce(p_nombre_responsable, '')), ''),
    p_telefono,
    nullif(trim(coalesce(p_correo, '')), ''),
    p_servicio,
    'Presencial',
    p_fecha,
    p_hora,
    nullif(trim(coalesce(p_motivo_consulta, '')), ''),
    'Pendiente',
    false,
    v_paciente_id
  )
  returning id into v_cita_id;

  return v_cita_id;
end;
$function$;

revoke all on function public.obtener_horarios_disponibles(date) from public;
revoke all on function public.registrar_cita_publica(
  text,
  integer,
  text,
  text,
  text,
  text,
  date,
  time without time zone,
  text
) from public;

grant execute on function public.obtener_horarios_disponibles(date)
to anon, authenticated;

grant execute on function public.registrar_cita_publica(
  text,
  integer,
  text,
  text,
  text,
  text,
  date,
  time without time zone,
  text
) to anon, authenticated;

drop policy if exists "Permitir consultar horarios" on public.citas;
drop policy if exists "Permitir validar horarios disponibles" on public.citas;
drop policy if exists "Permitir registrar citas" on public.citas;
drop policy if exists "Publico puede buscar pacientes por telefono" on public.pacientes;
drop policy if exists "Se pueden registrar pacientes desde citas" on public.pacientes;
