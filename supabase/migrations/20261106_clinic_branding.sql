-- Apply after 20261105_multiclinic_foundation.sql. Existing clinic data is preserved.
alter table public.clinicas
  add column if not exists color_primario text not null default '#6B4F9B',
  add column if not exists color_secundario text not null default '#9A7DCC',
  add column if not exists color_boton text not null default '#6B4F9B',
  add column if not exists mapa_embed_url text;

create or replace function public.actualizar_apariencia_clinica(
  p_clinica_id uuid,
  p_color_primario text,
  p_color_secundario text,
  p_color_boton text,
  p_direccion text,
  p_mapa_url text,
  p_mapa_embed_url text
)
returns void
language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.puede_editar_clinica(p_clinica_id) then
    raise exception using errcode = '42501', message = 'No puedes editar esta clínica.';
  end if;

  if p_color_primario !~ '^#[0-9A-Fa-f]{6}$'
     or p_color_secundario !~ '^#[0-9A-Fa-f]{6}$'
     or p_color_boton !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception using errcode = '22023', message = 'Los colores deben ser valores hexadecimales de seis dígitos.';
  end if;

  if nullif(trim(p_mapa_url), '') is not null
     and p_mapa_url !~* '^https://(www\.google\.com/maps|google\.com/maps|maps\.google\.com/|maps\.app\.goo\.gl/)' then
    raise exception using errcode = '22023', message = 'El enlace debe ser de Google Maps.';
  end if;

  if nullif(trim(p_mapa_embed_url), '') is not null
     and p_mapa_embed_url !~* '^https://www\.google\.com/maps/embed\?' then
    raise exception using errcode = '22023', message = 'Usa el enlace para insertar un mapa de Google Maps.';
  end if;

  update public.clinicas
  set color_primario = upper(p_color_primario),
      color_secundario = upper(p_color_secundario),
      color_boton = upper(p_color_boton),
      direccion = nullif(trim(p_direccion), ''),
      mapa_url = nullif(trim(p_mapa_url), ''),
      mapa_embed_url = nullif(trim(p_mapa_embed_url), '')
  where id = p_clinica_id;
end;
$$;

revoke all on function public.actualizar_apariencia_clinica(
  uuid, text, text, text, text, text, text
) from public, anon;
grant execute on function public.actualizar_apariencia_clinica(
  uuid, text, text, text, text, text, text
) to authenticated;
