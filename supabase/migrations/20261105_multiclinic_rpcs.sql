-- Install immediately after 20261105_multiclinic_foundation.sql.
begin;

create or replace function public.contar_pacientes_clinica()
returns integer
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select count(*)::integer from public.pacientes
  where clinica_id = public.clinica_actual();
$$;

create or replace function public.obtener_horarios_clinica(
  p_clinica_id uuid, fecha_consulta date
)
returns table (hora_disponible time without time zone, disponible boolean)
language sql security definer
set search_path = pg_catalog, public
as $$
  with horarios as (
    select generate_series(
      fecha_consulta + time '09:00',
      fecha_consulta + time '13:00',
      interval '30 minutes'
    ) as inicio
  )
  select h.inicio::time,
    exists (select 1 from public.clinicas where id = p_clinica_id and activa)
    and extract(isodow from fecha_consulta) between 1 and 6
    and not exists (
      select 1 from public.citas c
      where c.clinica_id = p_clinica_id
        and c.fecha = fecha_consulta
        and c.estatus is distinct from 'Cancelada'
        and h.inicio < c.fecha + c.hora + interval '1 hour'
        and h.inicio + interval '1 hour' > c.fecha + c.hora
    )
  from horarios h
  order by h.inicio;
$$;

create or replace function public.registrar_cita_clinica(
  p_clinica_id uuid,
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
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_paciente_id bigint;
  v_cita_id bigint;
  v_primera boolean := false;
  v_hoy date := (current_timestamp at time zone 'America/Mexico_City')::date;
begin
  if not exists (select 1 from public.clinicas where id = p_clinica_id and activa) then
    raise exception using errcode = '22023', message = 'La clínica no está disponible.';
  end if;
  if not public.nombre_humano_valido(p_nombre_paciente, false) then
    raise exception using errcode = '22023', message = 'El nombre del paciente no es válido.';
  end if;
  if nullif(trim(coalesce(p_nombre_responsable, '')), '') is not null
     and not public.nombre_humano_valido(p_nombre_responsable, true) then
    raise exception using errcode = '22023', message = 'Escribe el nombre completo del responsable.';
  end if;
  if coalesce(p_telefono, '') !~ '^[0-9]{10}$' then
    raise exception using errcode = '22023', message = 'El teléfono debe contener 10 dígitos.';
  end if;
  if nullif(trim(coalesce(p_correo, '')), '') is not null
     and trim(p_correo) !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception using errcode = '22023', message = 'El correo no es válido.';
  end if;
  if p_fecha_nacimiento is null
     or p_fecha_nacimiento > v_hoy
     or p_fecha_nacimiento < (v_hoy - interval '99 years')::date
     or p_edad is distinct from date_part('year', age(v_hoy, p_fecha_nacimiento))::integer then
    raise exception using errcode = '22023', message = 'La fecha de nacimiento o la edad no es válida.';
  end if;
  if p_fecha < v_hoy or p_fecha > (v_hoy + interval '14 days')::date
     or extract(isodow from p_fecha) not between 1 and 6 then
    raise exception using errcode = '22023', message = 'La fecha no está disponible.';
  end if;
  if p_hora < time '09:00' or p_hora > time '13:00'
     or extract(minute from p_hora)::integer % 30 <> 0
     or extract(second from p_hora) <> 0 then
    raise exception using errcode = '22023', message = 'La hora no es válida.';
  end if;
  if not exists (
    select 1 from public.servicios_clinica
    where clinica_id = p_clinica_id and nombre = p_servicio and activo
  ) then
    raise exception using errcode = '22023', message = 'El servicio no está disponible.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_clinica_id::text || p_fecha::text));

  if exists (
    select 1 from public.citas
    where clinica_id = p_clinica_id and fecha = p_fecha
      and estatus is distinct from 'Cancelada'
      and p_hora < hora + interval '1 hour'
      and p_hora + interval '1 hour' > hora
  ) then
    raise exception using errcode = '23P01', message = 'El horario ya no está disponible.';
  end if;

  select id into v_paciente_id
  from public.pacientes
  where clinica_id = p_clinica_id and telefono = p_telefono
    and lower(trim(nombre_paciente)) = lower(trim(p_nombre_paciente))
  order by id limit 1;

  if v_paciente_id is null then
    v_primera := true;
    insert into public.pacientes (
      clinica_id, nombre_paciente, edad, fecha_nacimiento, nombre_responsable,
      telefono, correo, direccion, contacto_2_nombre, contacto_2_parentesco,
      contacto_2_telefono, contacto_2_direccion, contacto_3_nombre,
      contacto_3_parentesco, contacto_3_telefono, contacto_3_direccion,
      observaciones_localizacion
    ) values (
      p_clinica_id, trim(p_nombre_paciente), p_edad, p_fecha_nacimiento,
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
    ) returning id into v_paciente_id;
  end if;

  insert into public.citas (
    clinica_id, nombre_paciente, edad, nombre_responsable, telefono, correo,
    servicio, modalidad, fecha, hora, motivo_consulta, estatus, confirmado,
    primera_consulta, paciente_id
  ) values (
    p_clinica_id, trim(p_nombre_paciente), p_edad,
    nullif(trim(coalesce(p_nombre_responsable, '')), ''), p_telefono,
    nullif(trim(coalesce(p_correo, '')), ''), p_servicio, 'Presencial',
    p_fecha, p_hora, nullif(trim(coalesce(p_motivo_consulta, '')), ''),
    'Pendiente', false, v_primera, v_paciente_id
  ) returning id into v_cita_id;

  if v_primera then
    insert into public.envios_reglamento (clinica_id, paciente_id, cita_id, destinatario)
    values (p_clinica_id, v_paciente_id, v_cita_id, nullif(trim(coalesce(p_correo, '')), ''))
    on conflict (paciente_id) do nothing;
  end if;

  return jsonb_build_object(
    'cita_id', v_cita_id,
    'paciente_id', v_paciente_id,
    'primera_cita', v_primera
  );
end;
$$;

create or replace function public.programar_citas_paciente(
  p_paciente_id bigint, p_servicio text, p_motivo_consulta text, p_citas jsonb
)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_paciente public.pacientes%rowtype;
  v_item jsonb;
  v_fecha date;
  v_hora time without time zone;
  v_ids bigint[] := array[]::bigint[];
  v_id bigint;
begin
  select * into v_paciente from public.pacientes where id = p_paciente_id;
  if not found or not public.puede_editar_clinica(v_paciente.clinica_id) then
    raise exception using errcode = '42501', message = 'No puedes programar citas de este paciente.';
  end if;
  if not exists (select 1 from public.servicios_clinica
                 where clinica_id = v_paciente.clinica_id and nombre = p_servicio and activo) then
    raise exception using errcode = '22023', message = 'El servicio no está disponible.';
  end if;
  if p_citas is null or jsonb_typeof(p_citas) <> 'array'
     or jsonb_array_length(p_citas) = 0 then
    raise exception using errcode = '22023', message = 'Agrega al menos una cita.';
  end if;

  for v_item in select value from jsonb_array_elements(p_citas) loop
    v_fecha := (v_item ->> 'fecha')::date;
    v_hora := (v_item ->> 'hora')::time;
    if v_fecha < (current_timestamp at time zone 'America/Mexico_City')::date
       or extract(isodow from v_fecha) not between 1 and 6
       or v_hora < time '09:00' or v_hora > time '13:00'
       or extract(minute from v_hora)::integer % 30 <> 0 then
      raise exception using errcode = '22023', message = 'Fecha u hora no válida.';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtext(v_paciente.clinica_id::text || v_fecha::text)
    );
    if exists (
      select 1 from public.citas
      where clinica_id = v_paciente.clinica_id and fecha = v_fecha
        and estatus is distinct from 'Cancelada'
        and v_hora < hora + interval '1 hour'
        and v_hora + interval '1 hour' > hora
    ) then
      raise exception using errcode = '23P01', message = 'Uno de los horarios ya está ocupado.';
    end if;
    insert into public.citas (
      clinica_id, nombre_paciente, edad, nombre_responsable, telefono, correo,
      servicio, modalidad, fecha, hora, motivo_consulta, estatus, confirmado,
      primera_consulta, paciente_id
    ) values (
      v_paciente.clinica_id, v_paciente.nombre_paciente, v_paciente.edad,
      v_paciente.nombre_responsable, v_paciente.telefono, v_paciente.correo,
      p_servicio, 'Presencial', v_fecha, v_hora,
      nullif(trim(coalesce(p_motivo_consulta, '')), ''), 'Confirmada', true,
      false, p_paciente_id
    ) returning id into v_id;
    v_ids := array_append(v_ids, v_id);
  end loop;
  return jsonb_build_object('paciente_id', p_paciente_id,
    'citas_creadas', cardinality(v_ids), 'cita_ids', to_jsonb(v_ids));
end;
$$;

create or replace function public.eliminar_paciente_admin(p_paciente_id bigint)
returns void
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_clinica_id uuid;
begin
  select clinica_id into v_clinica_id from public.pacientes where id = p_paciente_id;
  if v_clinica_id is null or not public.puede_editar_clinica(v_clinica_id) then
    raise exception using errcode = '42501', message = 'No puedes archivar este paciente.';
  end if;
  update public.pacientes set activo = false where id = p_paciente_id and clinica_id = v_clinica_id;
  update public.citas set estatus = 'Cancelada', confirmado = false
  where paciente_id = p_paciente_id and clinica_id = v_clinica_id
    and estatus is distinct from 'Cancelada';
end;
$$;

create or replace function public.actualizar_rol_usuario(
  p_user_id uuid, p_role text, p_active boolean
)
returns void
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_clinica_id uuid;
  v_plataforma_admin boolean;
begin
  select clinica_id, plataforma_admin into v_clinica_id, v_plataforma_admin
  from public.app_profiles where id = p_user_id;
  if v_clinica_id is null
     or not public.puede_gestionar_usuarios_clinica(v_clinica_id) then
    raise exception using errcode = '42501', message = 'No puedes modificar este usuario.';
  end if;
  if p_role not in ('master_admin', 'admin', 'user') then
    raise exception using errcode = '22023', message = 'Rol no válido.';
  end if;
  if v_plataforma_admin and not public.es_admin_plataforma() then
    raise exception using errcode = '42501', message = 'No puedes modificar al creador de la plataforma.';
  end if;
  if p_user_id = auth.uid() and (p_role <> 'master_admin' or not p_active) then
    raise exception using errcode = '22023', message = 'No puedes quitarte el acceso maestro.';
  end if;
  update public.app_profiles set role = p_role, active = p_active, updated_at = now()
  where id = p_user_id and clinica_id = v_clinica_id;
end;
$$;

create or replace function public.alternar_like_clinica(
  p_clinica_id uuid, p_publicacion_id uuid, p_visitante_id uuid
)
returns table (liked boolean, likes_count integer)
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_liked boolean;
  v_total integer;
begin
  if p_visitante_id is null or not exists (
    select 1 from public.galeria_terapias
    where clinica_id = p_clinica_id and publicacion_id = p_publicacion_id and activo
  ) then
    raise exception using errcode = '22023', message = 'Publicación no disponible.';
  end if;
  delete from public.galeria_likes
  where clinica_id = p_clinica_id and publicacion_id = p_publicacion_id
    and visitante_id = p_visitante_id;
  if found then
    v_liked := false;
  else
    insert into public.galeria_likes (clinica_id, publicacion_id, visitante_id)
    values (p_clinica_id, p_publicacion_id, p_visitante_id);
    v_liked := true;
  end if;
  select count(*)::integer into v_total from public.galeria_likes
  where clinica_id = p_clinica_id and publicacion_id = p_publicacion_id;
  update public.galeria_terapias set likes_count = v_total
  where clinica_id = p_clinica_id and publicacion_id = p_publicacion_id;
  return query select v_liked, v_total;
end;
$$;

grant execute on function public.obtener_horarios_clinica(uuid, date) to anon, authenticated;
grant execute on function public.contar_pacientes_clinica() to authenticated;
grant execute on function public.registrar_cita_clinica(
  uuid, text, integer, date, text, text, text, text, text, text,
  text, text, text, text, text, text, text, text, date, time without time zone, text
) to anon, authenticated;
grant execute on function public.programar_citas_paciente(bigint, text, text, jsonb) to authenticated;
grant execute on function public.eliminar_paciente_admin(bigint) to authenticated;
grant execute on function public.actualizar_rol_usuario(uuid, text, boolean) to authenticated;
grant execute on function public.alternar_like_clinica(uuid, uuid, uuid) to anon, authenticated;

commit;
