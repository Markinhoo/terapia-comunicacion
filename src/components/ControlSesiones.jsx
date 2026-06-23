import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatearFechaLocal } from '../utils/fechas';
import { generarControlSesionesPDF } from '../utils/generarControlSesionesPDF';
import FirmaCanvas from './FirmaCanvas';
import Toast from './Toast';
import PaginationControls from './PaginationControls';
import { useToast } from '../hooks/useToast';
import { usePaginatedList } from '../hooks/usePaginatedList';

const MONTO_TERAPIA = 300;

const formularioInicial = {
  cita_id: '',
  fecha_terapia: '',
  fecha_pago: '',
  cantidad: String(MONTO_TERAPIA),
  firma_data_url: ''
};

const formatoPesos = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
});

function ControlSesiones({ paciente }) {
  const [sesiones, setSesiones] = useState([]);
  const [citasPendientesPago, setCitasPendientesPago] = useState([]);
  const [form, setForm] = useState(formularioInicial);
  const [guardando, setGuardando] = useState(false);
  const { toast, mostrarToast, cerrarToast } = useToast();
  const sesionesPagination = usePaginatedList(sesiones, 5, sesiones.length);

  async function obtenerSesiones() {
    const { data, error } = await supabase
      .from('sesiones_paciente')
      .select('*')
      .eq('paciente_id', paciente.id)
      .order('fecha_terapia', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setSesiones(data || []);
  }

  async function obtenerCitasPendientesPago() {
    const { data, error } = await supabase
      .from('citas')
      .select('id, fecha, hora, servicio, estatus')
      .eq('paciente_id', paciente.id)
      .neq('estatus', 'Pagada')
      .neq('estatus', 'Cancelada')
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });

    if (error) {
      console.error(error);
      setCitasPendientesPago([]);
      return;
    }

    setCitasPendientesPago(data || []);
  }

  useEffect(() => {
    obtenerSesiones();
    obtenerCitasPendientesPago();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paciente.id]);

  const seleccionarCita = (citaId) => {
    const cita = citasPendientesPago.find((item) => String(item.id) === String(citaId));
    const sesionExistente = sesiones.find((sesion) => sesion.fecha_terapia === cita?.fecha);

    setForm({
      cita_id: citaId,
      fecha_terapia: cita?.fecha || '',
      fecha_pago: sesionExistente?.fecha_pago || formatearFechaLocal(),
      cantidad: sesionExistente?.cantidad != null
        ? String(Number(sesionExistente.cantidad))
        : String(MONTO_TERAPIA),
      firma_data_url: sesionExistente?.firma_data_url || ''
    });
  };

  const guardarSesion = async (event) => {
    event.preventDefault();

    if (!form.cita_id || !form.fecha_terapia) {
      mostrarToast('Selecciona la terapia pendiente de pago.', 'error');
      return;
    }

    if (!form.fecha_pago) {
      mostrarToast('Agrega la fecha de pago.', 'error');
      return;
    }

    if (!form.cantidad || Number(form.cantidad) <= 0) {
      mostrarToast('Agrega una cantidad mayor a cero.', 'error');
      return;
    }

    if (!form.firma_data_url) {
      mostrarToast('Agrega la firma antes de guardar el registro.', 'error');
      return;
    }

    setGuardando(true);

    const cantidad = Number(form.cantidad);
    const estatusPago = cantidad >= MONTO_TERAPIA ? 'Pagada' : 'Pendiente de pago';
    const citaSeleccionada = citasPendientesPago.find(
      (cita) => String(cita.id) === String(form.cita_id)
    );
    const sesionExistente = sesiones.find((sesion) => sesion.fecha_terapia === form.fecha_terapia);

    const datosSesion = {
      paciente_id: paciente.id,
      fecha_terapia: form.fecha_terapia,
      reagendada: citaSeleccionada?.estatus === 'Reagendada',
      fecha_reagenda: citaSeleccionada?.estatus === 'Reagendada'
        ? citaSeleccionada.fecha
        : null,
      fecha_pago: form.fecha_pago,
      cantidad,
      firma_data_url: form.firma_data_url || null
    };

    const { error } = sesionExistente
      ? await supabase
        .from('sesiones_paciente')
        .update(datosSesion)
        .eq('id', sesionExistente.id)
      : await supabase
        .from('sesiones_paciente')
        .insert([datosSesion]);

    if (error) {
      setGuardando(false);
      mostrarToast(error.code === '23505'
        ? 'Ya existe un registro para esa fecha de terapia.'
        : 'No se pudo guardar la sesión.', 'error');
      console.error(error);
      return;
    }

    const { error: errorCita } = await supabase
      .from('citas')
      .update({
        estatus: estatusPago,
        confirmado: true
      })
      .eq('id', form.cita_id);

    setGuardando(false);

    if (errorCita) {
      console.error(errorCita);
      mostrarToast('El pago se guardó, pero no se pudo actualizar el estatus de la cita.', 'error');
    }

    setForm(formularioInicial);
    await obtenerSesiones();
    await obtenerCitasPendientesPago();
    mostrarToast(
      estatusPago === 'Pagada'
        ? 'Pago completo registrado. La cita quedó pagada.'
        : 'Pago parcial registrado. La cita quedó pendiente de pago.',
      'success'
    );
  };

  return (
    <section className="expediente-card control-sesiones">
      <div className="section-actions">
        <div>
          <h2>Control de terapias y pagos</h2>
          <p className="subtitle">
            Registro equivalente al formato de control por paciente.
          </p>
        </div>

        <button
          type="button"
          disabled={sesiones.length === 0}
          onClick={() => generarControlSesionesPDF(paciente, sesiones)}
        >
          Generar informe
        </button>
      </div>

      <form className="session-form" onSubmit={guardarSesion}>
        <label>
          Terapia pendiente de pago
          <select
            value={form.cita_id}
            onChange={(event) => seleccionarCita(event.target.value)}
            required
          >
            <option value="">
              {citasPendientesPago.length
                ? 'Selecciona una terapia'
                : 'No hay terapias pendientes de pago'}
            </option>
            {citasPendientesPago.map((cita) => (
              <option key={cita.id} value={cita.id}>
                {cita.fecha} - {cita.hora?.slice(0, 5)} - {cita.servicio} ({cita.estatus})
              </option>
            ))}
          </select>
        </label>

        <label>
          Fecha de pago
          <input
            type="date"
            value={form.fecha_pago}
            onChange={(event) => setForm({ ...form, fecha_pago: event.target.value })}
          />
        </label>

        <label>
          Cantidad
          <span className="money-field">
            <span>$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.cantidad}
              onChange={(event) => setForm({ ...form, cantidad: event.target.value })}
              placeholder="300.00"
            />
          </span>
          <small>
            $300 marca la cita como pagada. Una cantidad menor la deja pendiente de pago.
          </small>
        </label>

        <div className="signature-field">
          <strong>Firma</strong>
          <FirmaCanvas
            value={form.firma_data_url}
            onChange={(firma) => setForm({ ...form, firma_data_url: firma })}
          />
        </div>

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Agregar registro'}
        </button>
      </form>

      <div className="table-container users-table-container">
        <table className="responsive-admin-table">
          <thead>
            <tr>
              <th>Fecha de terapia</th>
              <th>Reagenda</th>
              <th>Fecha de pago</th>
              <th>Cantidad</th>
              <th>Firma</th>
            </tr>
          </thead>
          <tbody>
            {sesionesPagination.paginatedItems.map((sesion) => (
              <tr key={sesion.id}>
                <td data-label="Fecha de terapia">{sesion.fecha_terapia}</td>
                <td data-label="Reagenda">
                  {sesion.reagendada
                    ? `Sí${sesion.fecha_reagenda ? `: ${sesion.fecha_reagenda}` : ''}`
                    : 'No'}
                </td>
                <td data-label="Fecha de pago">{sesion.fecha_pago || '-'}</td>
                <td data-label="Cantidad">
                  {sesion.cantidad != null
                    ? formatoPesos.format(Number(sesion.cantidad))
                    : '-'}
                </td>
                <td data-label="Firma">
                  {sesion.firma_data_url
                    ? <img className="firma-miniatura" src={sesion.firma_data_url} alt="Firma registrada" />
                    : 'Sin firma'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationControls
        page={sesionesPagination.page}
        totalPages={sesionesPagination.totalPages}
        totalItems={sesiones.length}
        onPageChange={sesionesPagination.setPage}
      />

      <Toast toast={toast} onClose={cerrarToast} />
    </section>
  );
}

export default ControlSesiones;
