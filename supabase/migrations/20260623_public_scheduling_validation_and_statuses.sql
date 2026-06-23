do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'citas_estatus_valido'
  ) then
    alter table public.citas
      add constraint citas_estatus_valido
      check (
        estatus in (
          'Pendiente',
          'Confirmada',
          'En curso',
          'Asistió',
          'No asistió',
          'Reagendada',
          'Pagada',
          'Pendiente de pago',
          'Cancelada'
        )
      ) not valid;
  end if;
end $$;

create or replace function public.nombre_humano_valido(p_nombre text, p_requerir_completo boolean default false)
returns boolean
language plpgsql
immutable
as $function$
declare
  v_nombre text := regexp_replace(trim(coalesce(p_nombre, '')), '\s+', ' ', 'g');
  v_palabra text;
begin
  if length(replace(v_nombre, ' ', '')) < 5 then
    return false;
  end if;

  if p_requerir_completo and array_length(regexp_split_to_array(v_nombre, '\s+'), 1) < 2 then
    return false;
  end if;

  if v_nombre !~* '^[[:alpha:]ÁÉÍÓÚÜÑáéíóúüñ ]+$' then
    return false;
  end if;

  if v_nombre ~* '(.)\1{2,}' then
    return false;
  end if;

  if lower(v_nombre) ~ '[bcdfghjklmnpqrstvwxyzñ]{5,}' then
    return false;
  end if;

  foreach v_palabra in array regexp_split_to_array(v_nombre, '\s+')
  loop
    if length(v_palabra) > 16 then
      return false;
    end if;

    if v_palabra !~* '[aeiouáéíóúü]' then
      return false;
    end if;
  end loop;

  return true;
end;
$function$;

create or replace function public.registrar_cita_publica_v2(
  p_nombre_paciente text,
  p_edad integer,
  p_fecha_nacimiento date,
  p_nombre_responsable text,
  p_telefono text,
  p_correo text,
  p_direccion text,
  p_contacto_2_nombre text,
  p_contacto_2_parentesco text,
  p_contacto_2_telefono text,
  p_contacto_2_direccion text,
  p_contacto_3_nombre text,
  p_contacto_3_parentesco text,
  p_contacto_3_telefono text,
  p_contacto_3_direccion text,
  p_observaciones_localizacion text,
  p_servicio text,
  p_fecha date,
  p_hora time without time zone,
  p_motivo_consulta text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_paciente_id bigint;
  v_cita_id bigint;
  v_primera_cita boolean := false;
  v_hoy date := (current_timestamp at time zone 'America/Mexico_City')::date;
  v_edad_calculada integer;
begin
  if not public.nombre_humano_valido(p_nombre_paciente, false) then
    raise exception using errcode = '22023', message = 'El nombre del paciente no es válido.';
  end if;

  if p_nombre_responsable is not null
     and trim(p_nombre_responsable) <> ''
     and not public.nombre_humano_valido(p_nombre_responsable, true) then
    raise exception using errcode = '22023', message = 'Escribe el nombre completo del responsable.';
  end if;

  if coalesce(p_telefono, '') !~ '^[0-9]{10}$' then
    raise exception using errcode = '22023', message = 'El teléfono debe contener 10 dígitos.';
  end if;

  if p_correo is not null
     and trim(p_correo) <> ''
     and trim(p_correo) !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception using errcode = '22023', message = 'El correo no es válido.';
  end if;

  if p_fecha_nacimiento is null then
    raise exception using errcode = '22023', message = 'La fecha de nacimiento es obligatoria.';
  end if;

  if p_fecha_nacimiento > v_hoy or p_fecha_nacimiento < (v_hoy - interval '99 years')::date then
    raise exception using errcode = '22023', message = 'La fecha de nacimiento no es válida.';
  end if;

  v_edad_calculada := date_part('year', age(v_hoy, p_fecha_nacimiento))::integer;

  if p_edad is null or p_edad <> v_edad_calculada then
    raise exception using errcode = '22023', message = 'La edad no coincide con la fecha de nacimiento.';
  end if;

  if p_fecha < v_hoy
     or p_fecha > (v_hoy + interval '14 days')::date
     or extract(isodow from p_fecha) not between 1 and 6 then
    raise exception using errcode = '22023', message = 'La fecha no está disponible.';
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
    raise exception using errcode = '22023', message = 'El servicio no es válido.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_fecha::text));

  if exists (
    select 1
    from public.citas
    where fecha = p_fecha
      and estatus is distinct from 'Cancelada'
      and p_hora < hora + interval '1 hour'
      and p_hora + interval '1 hour' > hora
  ) then
    raise exception using errcode = '23P01', message = 'El horario ya no está disponible.';
  end if;

  select id into v_paciente_id
  from public.pacientes
  where telefono = p_telefono
    and lower(trim(nombre_paciente)) = lower(trim(p_nombre_paciente))
  order by id
  limit 1;

  if v_paciente_id is null then
    v_primera_cita := true;

    insert into public.pacientes (
      nombre_paciente, edad, fecha_nacimiento, nombre_responsable, telefono,
      correo, direccion, contacto_2_nombre, contacto_2_parentesco,
      contacto_2_telefono, contacto_2_direccion, contacto_3_nombre,
      contacto_3_parentesco, contacto_3_telefono, contacto_3_direccion,
      observaciones_localizacion
    )
    values (
      trim(p_nombre_paciente), p_edad, p_fecha_nacimiento,
      nullif(trim(coalesce(p_nombre_responsable, '')), ''), p_telefono,
      nullif(trim(coalesce(p_correo, '')), ''),
      nullif(trim(coalesce(p_direccion, '')), ''),
      nullif(trim(coalesce(p_contacto_2_nombre, '')), ''),
      nullif(trim(coalesce(p_contacto_2_parentesco, '')), ''),
      nullif(trim(coalesce(p_contacto_2_telefono, '')), ''),
      nullif(trim(coalesce(p_contacto_2_direccion, '')), ''),
      nullif(trim(coalesce(p_contacto_3_nombre, '')), ''),
      nullif(trim(coalesce(p_contacto_3_parentesco, '')), ''),
      nullif(trim(coalesce(p_contacto_3_telefono, '')), ''),
      nullif(trim(coalesce(p_contacto_3_direccion, '')), ''),
      nullif(trim(coalesce(p_observaciones_localizacion, '')), '')
    )
    returning id into v_paciente_id;
  end if;

  insert into public.citas (
    nombre_paciente, edad, nombre_responsable, telefono, correo, servicio,
    modalidad, fecha, hora, motivo_consulta, estatus, confirmado,
    primera_consulta, paciente_id
  )
  values (
    trim(p_nombre_paciente), p_edad,
    nullif(trim(coalesce(p_nombre_responsable, '')), ''), p_telefono,
    nullif(trim(coalesce(p_correo, '')), ''), p_servicio, 'Presencial',
    p_fecha, p_hora, nullif(trim(coalesce(p_motivo_consulta, '')), ''),
    'Pendiente', false, v_primera_cita, v_paciente_id
  )
  returning id into v_cita_id;

  if v_primera_cita then
    insert into public.envios_reglamento (
      paciente_id, cita_id, destinatario
    )
    values (
      v_paciente_id, v_cita_id, nullif(trim(coalesce(p_correo, '')), '')
    )
    on conflict (paciente_id) do nothing;
  end if;

  return jsonb_build_object(
    'cita_id', v_cita_id,
    'paciente_id', v_paciente_id,
    'primera_cita', v_primera_cita
  );
end;
$function$;

revoke all on function public.nombre_humano_valido(text, boolean) from public;
grant execute on function public.nombre_humano_valido(text, boolean) to anon, authenticated;
