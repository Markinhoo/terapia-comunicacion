-- One-time reset of the former test clinic. Run BEFORE the multiclinic
-- migrations so invalid legacy sessions cannot block their backfill.
-- This permanently removes data. Keep OUT of supabase/migrations.
-- Auth users and app_profiles are removed separately with cleanupLegacyUsers.mjs.
-- Storage files require API cleanup with cleanupLegacyStorage.mjs.

begin;

do $$
declare
  v_table text;
  v_creator_count integer;
begin
  select count(*) into v_creator_count
  from public.app_profiles
  where lower(trim(email)) = 'markos_ff7@hotmail.com'
    and role = 'master_admin'
    and active;

  if v_creator_count <> 1 then
    raise exception 'No se encontró exactamente un master_admin activo con el correo markos_ff7@hotmail.com. No se borró nada.';
  end if;

  if to_regclass('public.clinicas') is not null then
    if (select count(*) from public.clinicas) <> 1
       or not exists (select 1 from public.clinicas where slug = 'clinica-evocare') then
      raise exception 'La limpieza solo se permite antes de la migración o cuando Evocaré es la única clínica.';
    end if;
  end if;

  foreach v_table in array array[
    'envios_reglamento',
    'sesiones_paciente',
    'archivos_paciente',
    'paciente_objetivos',
    'objetivos_terapeuticos',
    'expedientes',
    'paciente_detalle',
    'citas',
    'pacientes',
    'galeria_likes',
    'galeria_terapias'
  ] loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format('delete from public.%I', v_table);
    end if;
  end loop;

  if to_regclass('public.invitaciones_usuario') is not null then
    delete from public.invitaciones_usuario;
  end if;

  if to_regclass('public.bitacora_cambios') is not null then
    delete from public.bitacora_cambios;
  end if;
end $$;

commit;
