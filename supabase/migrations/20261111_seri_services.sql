-- Initial service catalog for Clínica SERI. Safe to run before or after creating it.
begin;

create or replace function public.seed_seri_services(p_clinica_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.servicios_clinica (clinica_id, nombre, descripcion, orden)
  select p_clinica_id, s.nombre, s.descripcion, s.orden
  from (values
    ('Estimulación temprana', 'Actividades de juego y movimiento para acompañar el desarrollo durante los primeros años.', 0),
    ('Terapia de aprendizaje', 'Apoyo individual para fortalecer habilidades de atención, comprensión y aprendizaje.', 1),
    ('Terapia en alimentación', 'Acompañamiento para desarrollar habilidades de alimentación según las necesidades de cada niño.', 2),
    ('Terapia de lenguaje', 'Intervención para favorecer la comprensión, expresión y comunicación.', 3),
    ('Terapia de integración sensorial', 'Actividades terapéuticas para apoyar el procesamiento sensorial y la participación cotidiana.', 4),
    ('Psicología', 'Acompañamiento emocional y conductual para niños y sus familias.', 5)
  ) as s(nombre, descripcion, orden)
  on conflict (clinica_id, nombre) do nothing;
$$;

revoke all on function public.seed_seri_services(uuid) from public, anon, authenticated;

create or replace function public.seed_seri_services_on_clinic_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slug = 'clinica-seri' then
    perform public.seed_seri_services(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists seed_seri_services_on_clinic_insert on public.clinicas;
create trigger seed_seri_services_on_clinic_insert
after insert on public.clinicas
for each row execute function public.seed_seri_services_on_clinic_insert();

do $$
declare
  v_clinica_id uuid;
begin
  select id into v_clinica_id from public.clinicas where slug = 'clinica-seri';
  if v_clinica_id is not null then
    perform public.seed_seri_services(v_clinica_id);
  end if;
end;
$$;

commit;
