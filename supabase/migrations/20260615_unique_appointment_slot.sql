-- Review existing conflicts before applying the unique index:
--
-- select fecha, hora, count(*)
-- from public.citas
-- where estatus is distinct from 'Cancelada'
-- group by fecha, hora
-- having count(*) > 1;

create unique index if not exists citas_horario_activo_unico
on public.citas (fecha, hora)
where estatus is distinct from 'Cancelada';
