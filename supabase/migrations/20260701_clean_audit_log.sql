alter table public.bitacora_cambios
  add column if not exists descripcion text;

create or replace function public.audit_table_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  v_email text;
  v_record_id text;
  v_changes jsonb;
  v_old_clean jsonb;
  v_new_clean jsonb;
  v_current jsonb;
  v_changed_fields text[];
  v_descripcion text;
begin
  select email into v_email
  from auth.users
  where id = auth.uid();

  if tg_op = 'DELETE' then
    v_record_id := coalesce(to_jsonb(old)->>'id', null);
    v_current := to_jsonb(old);
    v_changes := jsonb_build_object('old', to_jsonb(old));
  elsif tg_op = 'UPDATE' then
    v_record_id := coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id');
    v_current := to_jsonb(new);
    v_old_clean := to_jsonb(old) - 'updated_at';
    v_new_clean := to_jsonb(new) - 'updated_at';

    if v_old_clean = v_new_clean then
      return new;
    end if;

    select coalesce(array_agg(key order by key), array[]::text[])
    into v_changed_fields
    from jsonb_object_keys(v_new_clean) as key
    where (v_old_clean -> key) is distinct from (v_new_clean -> key);

    v_changes := jsonb_build_object(
      'old', to_jsonb(old),
      'new', to_jsonb(new),
      'campos', v_changed_fields
    );
  else
    v_record_id := coalesce(to_jsonb(new)->>'id', null);
    v_current := to_jsonb(new);
    v_changes := jsonb_build_object('new', to_jsonb(new));
  end if;

  if tg_table_name = 'app_profiles' then
    if tg_op = 'INSERT' then
      v_descripcion := format(
        'Usuario creado: %s con rol %s.',
        coalesce(new.email, 'sin correo'),
        coalesce(new.role, 'sin rol')
      );
    elsif tg_op = 'UPDATE' then
      v_descripcion := format(
        'Usuario actualizado: %s. Rol: %s -> %s. Estado: %s -> %s.',
        coalesce(new.email, old.email, 'sin correo'),
        coalesce(old.role, '-'),
        coalesce(new.role, '-'),
        case when old.active then 'activo' else 'inactivo' end,
        case when new.active then 'activo' else 'inactivo' end
      );
    else
      v_descripcion := format('Usuario eliminado: %s.', coalesce(old.email, 'sin correo'));
    end if;
  elsif tg_table_name = 'invitaciones_usuario' then
    if tg_op = 'INSERT' then
      v_descripcion := format(
        'Invitacion de usuario creada para %s con rol %s.',
        coalesce(new.email, 'sin correo'),
        coalesce(new.role, 'sin rol')
      );
    elsif tg_op = 'UPDATE' then
      v_descripcion := format(
        'Invitacion actualizada para %s. Estado: %s -> %s.',
        coalesce(new.email, old.email, 'sin correo'),
        coalesce(old.estado, '-'),
        coalesce(new.estado, '-')
      );
    else
      v_descripcion := format('Invitacion eliminada para %s.', coalesce(old.email, 'sin correo'));
    end if;
  elsif tg_table_name = 'citas' then
    if tg_op = 'INSERT' then
      v_descripcion := format(
        'Cita creada para %s el %s a las %s.',
        coalesce(new.nombre_paciente, 'paciente sin nombre'),
        coalesce(new.fecha::text, 'sin fecha'),
        coalesce(left(new.hora::text, 5), 'sin hora')
      );
    elsif tg_op = 'UPDATE' then
      if old.fecha is distinct from new.fecha or old.hora is distinct from new.hora then
        v_descripcion := format(
          'Cita reagendada para %s: %s %s -> %s %s.',
          coalesce(new.nombre_paciente, old.nombre_paciente, 'paciente sin nombre'),
          coalesce(old.fecha::text, 'sin fecha'),
          coalesce(left(old.hora::text, 5), 'sin hora'),
          coalesce(new.fecha::text, 'sin fecha'),
          coalesce(left(new.hora::text, 5), 'sin hora')
        );
      elsif old.estatus is distinct from new.estatus then
        v_descripcion := format(
          'Estatus de cita actualizado para %s: %s -> %s.',
          coalesce(new.nombre_paciente, old.nombre_paciente, 'paciente sin nombre'),
          coalesce(old.estatus, '-'),
          coalesce(new.estatus, '-')
        );
      else
        v_descripcion := format(
          'Cita actualizada para %s el %s.',
          coalesce(new.nombre_paciente, old.nombre_paciente, 'paciente sin nombre'),
          coalesce(new.fecha::text, old.fecha::text, 'sin fecha')
        );
      end if;
    else
      v_descripcion := format(
        'Cita eliminada para %s el %s.',
        coalesce(old.nombre_paciente, 'paciente sin nombre'),
        coalesce(old.fecha::text, 'sin fecha')
      );
    end if;
  elsif tg_table_name = 'sesiones_paciente' then
    if tg_op = 'INSERT' then
      v_descripcion := format(
        'Pago registrado para paciente %s por $%s en terapia del %s.',
        coalesce(new.paciente_id::text, '-'),
        coalesce(new.cantidad::text, '0'),
        coalesce(new.fecha_terapia::text, 'sin fecha')
      );
    elsif tg_op = 'UPDATE' then
      v_descripcion := format(
        'Pago actualizado para paciente %s en terapia del %s. Monto: $%s -> $%s.',
        coalesce(new.paciente_id::text, old.paciente_id::text, '-'),
        coalesce(new.fecha_terapia::text, old.fecha_terapia::text, 'sin fecha'),
        coalesce(old.cantidad::text, '0'),
        coalesce(new.cantidad::text, '0')
      );
    else
      v_descripcion := format(
        'Pago eliminado para paciente %s en terapia del %s.',
        coalesce(old.paciente_id::text, '-'),
        coalesce(old.fecha_terapia::text, 'sin fecha')
      );
    end if;
  elsif tg_table_name = 'galeria_terapias' then
    if tg_op = 'INSERT' then
      v_descripcion := format('Publicacion de galeria creada: %s.', coalesce(new.titulo, 'sin titulo'));
    elsif tg_op = 'UPDATE' then
      v_descripcion := format('Publicacion de galeria actualizada: %s.', coalesce(new.titulo, old.titulo, 'sin titulo'));
    else
      v_descripcion := format('Publicacion de galeria eliminada: %s.', coalesce(old.titulo, 'sin titulo'));
    end if;
  elsif tg_table_name = 'pacientes' then
    if tg_op = 'INSERT' then
      v_descripcion := format('Paciente creado: %s.', coalesce(new.nombre_paciente, 'sin nombre'));
    elsif tg_op = 'UPDATE' then
      if old.activo is distinct from new.activo then
        v_descripcion := format(
          'Paciente %s %s.',
          coalesce(new.nombre_paciente, old.nombre_paciente, 'sin nombre'),
          case when new.activo then 'reactivado' else 'archivado' end
        );
      else
        v_descripcion := format('Datos de paciente actualizados: %s.', coalesce(new.nombre_paciente, old.nombre_paciente, 'sin nombre'));
      end if;
    else
      v_descripcion := format('Paciente eliminado: %s.', coalesce(old.nombre_paciente, 'sin nombre'));
    end if;
  elsif tg_table_name = 'paciente_detalle' then
    v_descripcion := format(
      'Expediente clinico %s para paciente %s.',
      case tg_op when 'INSERT' then 'creado' when 'UPDATE' then 'actualizado' else 'eliminado' end,
      coalesce(v_current->>'paciente_id', '-')
    );
  elsif tg_table_name = 'archivos_paciente' then
    v_descripcion := format(
      'Archivo de expediente %s para paciente %s.',
      case tg_op when 'INSERT' then 'subido' when 'UPDATE' then 'actualizado' else 'eliminado' end,
      coalesce(v_current->>'paciente_id', '-')
    );
  elsif tg_table_name = 'paciente_objetivos' then
    v_descripcion := format(
      'Plan terapeutico %s para paciente %s.',
      case tg_op when 'INSERT' then 'agregado' when 'UPDATE' then 'actualizado' else 'eliminado' end,
      coalesce(v_current->>'paciente_id', '-')
    );
  else
    v_descripcion := format('%s en %s registro %s.', tg_op, tg_table_name, coalesce(v_record_id, '-'));
  end if;

  insert into public.bitacora_cambios (
    tabla,
    registro_id,
    accion,
    usuario_id,
    usuario_email,
    descripcion,
    cambios
  )
  values (
    tg_table_name,
    v_record_id,
    tg_op,
    auth.uid(),
    v_email,
    v_descripcion,
    jsonb_set(v_changes, '{descripcion}', to_jsonb(v_descripcion), true)
  );

  return coalesce(new, old);
end;
$function$;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'app_profiles',
    'invitaciones_usuario',
    'pacientes',
    'citas',
    'paciente_detalle',
    'archivos_paciente',
    'paciente_objetivos',
    'sesiones_paciente',
    'galeria_terapias'
  ]
  loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format('drop trigger if exists audit_%I on public.%I', v_table, v_table);
      execute format(
        'create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.audit_table_change()',
        v_table,
        v_table
      );
    end if;
  end loop;

  foreach v_table in array array[
    'expedientes',
    'objetivos_terapeuticos',
    'envios_reglamento'
  ]
  loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format('drop trigger if exists audit_%I on public.%I', v_table, v_table);
    end if;
  end loop;
end $$;
