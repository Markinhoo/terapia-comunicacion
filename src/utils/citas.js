export function obtenerRangoCita(cita) {
  const inicio = new Date(`${cita.fecha}T${cita.hora}`);
  const fin = new Date(inicio);
  fin.setMinutes(fin.getMinutes() + 60);

  return { inicio, fin };
}

export function estadoCitaActual(cita, ahora = new Date()) {
  const { inicio, fin } = obtenerRangoCita(cita);
  const limitePago = new Date(fin);
  limitePago.setMinutes(limitePago.getMinutes() + 60);

  if (cita.estatus === 'Cancelada') return 'Cancelada';
  if (cita.estatus === 'Pagada') return 'Pagada';
  if (cita.estatus === 'Pendiente de pago') return 'Pendiente de pago';

  if (cita.estatus === 'Asistió' && ahora >= limitePago) {
    return 'Pendiente de pago';
  }

  if (cita.estatus === 'Pendiente' && ahora >= inicio) {
    return 'Cancelada';
  }

  if (
    (cita.estatus === 'En curso' || cita.estatus === 'Confirmada') &&
    cita.confirmado &&
    ahora >= limitePago
  ) {
    return 'Pendiente de pago';
  }

  if (
    (cita.estatus === 'En curso' || cita.estatus === 'Confirmada') &&
    cita.confirmado &&
    ahora >= fin
  ) {
    return 'Asistió';
  }

  if (cita.estatus === 'Confirmada' && cita.confirmado && inicio <= ahora && ahora < fin) {
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

  const citasAsistidas = citas.filter((cita) => {
    return cita.estatus !== 'Asistió' && estadoCitaActual(cita, ahora) === 'Asistió';
  });

  const citasPendientesPago = citas.filter((cita) => {
    return cita.estatus !== 'Pendiente de pago'
      && estadoCitaActual(cita, ahora) === 'Pendiente de pago';
  });

  const citasCanceladas = citas.filter((cita) => {
    return cita.estatus !== 'Cancelada' && estadoCitaActual(cita, ahora) === 'Cancelada';
  });

  if (citasEnCurso.length > 0) {
    await supabase
      .from('citas')
      .update({ estatus: 'En curso' })
      .in('id', citasEnCurso.map((cita) => cita.id));
  }

  if (citasAsistidas.length > 0) {
    await supabase
      .from('citas')
      .update({ estatus: 'Asistió' })
      .in('id', citasAsistidas.map((cita) => cita.id));
  }

  if (citasPendientesPago.length > 0) {
    await supabase
      .from('citas')
      .update({ estatus: 'Pendiente de pago' })
      .in('id', citasPendientesPago.map((cita) => cita.id));
  }

  if (citasCanceladas.length > 0) {
    await supabase
      .from('citas')
      .update({ estatus: 'Cancelada', confirmado: false })
      .in('id', citasCanceladas.map((cita) => cita.id));
  }
}
