-- Private, tenant-scoped WhatsApp inbox. Apply after the multiclinic migrations.
begin;

create table public.whatsapp_cuentas (
  clinica_id uuid primary key references public.clinicas(id) on delete cascade,
  phone_number_id text unique check (phone_number_id ~ '^[0-9]{5,30}$'),
  activa boolean not null default false,
  updated_at timestamptz not null default now(),
  check (not activa or phone_number_id is not null)
);

create table public.whatsapp_conversaciones (
  id bigint generated always as identity primary key,
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  wa_id text not null check (wa_id ~ '^[0-9]{8,20}$'),
  nombre_contacto text not null default '',
  ultimo_mensaje_at timestamptz not null default now(),
  ultima_entrada_at timestamptz,
  created_at timestamptz not null default now(),
  unique (clinica_id, wa_id),
  unique (id, clinica_id)
);

create table public.whatsapp_mensajes (
  id bigint generated always as identity primary key,
  clinica_id uuid not null,
  conversacion_id bigint not null,
  wamid text not null unique,
  direccion text not null check (direccion in ('entrante', 'saliente')),
  tipo text not null default 'text',
  cuerpo text not null default '',
  estado text not null default 'recibido'
    check (estado in ('recibido', 'enviado', 'entregado', 'leido', 'fallido')),
  created_at timestamptz not null default now(),
  foreign key (conversacion_id, clinica_id)
    references public.whatsapp_conversaciones(id, clinica_id) on delete cascade
);

create index whatsapp_conversaciones_recientes
  on public.whatsapp_conversaciones (clinica_id, ultimo_mensaje_at desc);
create index whatsapp_mensajes_hilo
  on public.whatsapp_mensajes (conversacion_id, created_at, id);

alter table public.whatsapp_cuentas enable row level security;
alter table public.whatsapp_conversaciones enable row level security;
alter table public.whatsapp_mensajes enable row level security;

create policy whatsapp_cuentas_lectura on public.whatsapp_cuentas
for select to authenticated
using (public.es_admin_plataforma() or public.puede_editar_clinica(clinica_id));

create policy whatsapp_cuentas_creador_insert on public.whatsapp_cuentas
for insert to authenticated with check (public.es_admin_plataforma());
create policy whatsapp_cuentas_creador_update on public.whatsapp_cuentas
for update to authenticated using (public.es_admin_plataforma())
with check (public.es_admin_plataforma());

create policy whatsapp_conversaciones_admin on public.whatsapp_conversaciones
for select to authenticated using (public.puede_editar_clinica(clinica_id));
create policy whatsapp_mensajes_admin on public.whatsapp_mensajes
for select to authenticated using (public.puede_editar_clinica(clinica_id));

grant select, insert, update on public.whatsapp_cuentas to authenticated;
grant select on public.whatsapp_conversaciones, public.whatsapp_mensajes to authenticated;

commit;
