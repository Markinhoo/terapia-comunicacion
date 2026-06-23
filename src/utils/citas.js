export function obtenerRangoCita(cita) {
  const inicio = new Date(`${cita.fecha}T${cita.hora}`);
  const fin = new Date(inicio);
  fin.setMinutes(fin.getMinutes() + 60);

  return { inicio, fin };
}

export function estadoCitaActual(cita, ahora = new Date()) {
  const { inicio, fin } = obtenerRangoCita(cita);

  if (cita.estatus === 'Cancelada') return 'Cancelada';

  if (cita.confirmado && inicio <= ahora && ahora < fin) {
    return 'En curso';
  }

  return cita.estatus;
}

export function citaVisibleEnAgenda(cita, ahora = new Date()) {
  const { fin } = obtenerRangoCita(cita);
  const fechaHoy = [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, '0'),
    String(ahora.getDate()).padStart(2, '0')
  ].join('-');

  return cita.estatus !== 'Cancelada' && (fin > ahora || cita.fecha === fechaHoy);
}

export async function sincronizarCitasEnCurso(supabase, citas, ahora = new Date()) {
  const citasEnCurso = citas.filter((cita) => {
    return cita.estatus !== 'En curso' && estadoCitaActual(cita, ahora) === 'En curso';
  });

  if (citasEnCurso.length === 0) return;

  await supabase
    .from('citas')
    .update({ estatus: 'En curso' })
    .in('id', citasEnCurso.map((cita) => cita.id));
}
