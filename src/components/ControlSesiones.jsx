import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatearFechaLocal } from '../utils/fechas';
import { generarControlSesionesPDF } from '../utils/generarControlSesionesPDF';
import FirmaCanvas from './FirmaCanvas';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';

const formularioInicial = {
  fecha_terapia: formatearFechaLocal(),
  reagendada: false,
  fecha_reagenda: '',
  fecha_pago: '',
  cantidad: '',
  firma_data_url: ''
};

const formatoPesos = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
});

function ControlSesiones({ paciente }) {
  const [sesiones, setSesiones] = useState([]);
  const [form, setForm] = useState(formularioInicial);
  const [guardando, setGuardando] = useState(false);
  const { toast, mostrarToast, cerrarToast } = useToast();

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

  useEffect(() => {
    obtenerSesiones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paciente.id]);

  const guardarSesion = async (event) => {
    event.preventDefault();

    if (!form.fecha_terapia) {
      mostrarToast('Selecciona la fecha de terapia.', 'error');
      return;
    }

    if (sesiones.some((sesion) => sesion.fecha_terapia === form.fecha_terapia)) {
      mostrarToast('Ya existe un registro para esa fecha de terapia.', 'error');
      return;
    }

    if (form.reagendada && !form.fecha_reagenda) {
      mostrarToast('Indica la nueva fecha cuando la terapia fue reagendada.', 'error');
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

    const { error } = await supabase
      .from('sesiones_paciente')
      .insert([{
        paciente_id: paciente.id,
        fecha_terapia: form.fecha_terapia,
        reagendada: form.reagendada,
        fecha_reagenda: form.reagendada && form.fecha_reagenda
          ? form.fecha_reagenda
          : null,
        fecha_pago: form.fecha_pago || null,
        cantidad: form.cantidad ? Number(form.cantidad) : null,
        firma_data_url: form.firma_data_url || null
      }]);

    setGuardando(false);

    if (error) {
      mostrarToast(error.code === '23505'
        ? 'Ya existe un registro para esa fecha de terapia.'
        : 'No se pudo guardar la sesion.', 'error');
      console.error(error);
      return;
    }

    setForm({
      ...formularioInicial,
      fecha_terapia: formatearFechaLocal()
    });
    obtenerSesiones();
    mostrarToast('Registro de terapia y pago agregado correctamente.', 'success');
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
          Fecha de terapia
          <input
            type="date"
            value={form.fecha_terapia}
            onChange={(event) => setForm({ ...form, fecha_terapia: event.target.value })}
            required
          />
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={form.reagendada}
            onChange={(event) => setForm({ ...form, reagendada: event.target.checked })}
          />
          Fue reagendada
        </label>

        {form.reagendada && (
          <label>
            Nueva fecha
            <input
              type="date"
              value={form.fecha_reagenda}
              onChange={(event) => setForm({ ...form, fecha_reagenda: event.target.value })}
            />
          </label>
        )}

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
              placeholder="0.00"
            />
          </span>
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

      <div className="table-container">
        <table>
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
            {sesiones.map((sesion) => (
              <tr key={sesion.id}>
                <td>{sesion.fecha_terapia}</td>
                <td>
                  {sesion.reagendada
                    ? `Si${sesion.fecha_reagenda ? `: ${sesion.fecha_reagenda}` : ''}`
                    : 'No'}
                </td>
                <td>{sesion.fecha_pago || '-'}</td>
                <td>
                  {sesion.cantidad != null
                    ? formatoPesos.format(Number(sesion.cantidad))
                    : '-'}
                </td>
                <td>
                  {sesion.firma_data_url
                    ? <img className="firma-miniatura" src={sesion.firma_data_url} alt="Firma registrada" />
                    : 'Sin firma'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Toast toast={toast} onClose={cerrarToast} />
    </section>
  );
}

export default ControlSesiones;
