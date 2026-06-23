import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatearFechaLocal } from '../utils/fechas';
import { generarReporteFinanzasPDF } from '../utils/generarReporteFinanzasPDF';

const formatoPesos = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
});

function inicioSemana(fecha = new Date()) {
  const copia = new Date(fecha);
  const dia = copia.getDay() || 7;
  copia.setDate(copia.getDate() - dia + 1);
  return formatearFechaLocal(copia);
}

function inicioQuincena(fecha = new Date()) {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() <= 15 ? 1 : 16);
  return formatearFechaLocal(copia);
}

function inicioMes(fecha = new Date()) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-01`;
}

function Finanzas() {
  const hoy = formatearFechaLocal();
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [rango, setRango] = useState({
    inicio: inicioMes(new Date()),
    fin: hoy
  });

  async function cargarPagos() {
    setCargando(true);
    setMensaje('');

    const { data, error } = await supabase
      .from('sesiones_paciente')
      .select(`
        id,
        paciente_id,
        fecha_terapia,
        fecha_pago,
        cantidad,
        reagendada,
        fecha_reagenda,
        pacientes(nombre_paciente, nombre_responsable, telefono, correo)
      `)
      .not('fecha_pago', 'is', null)
      .not('cantidad', 'is', null)
      .order('fecha_pago', { ascending: false });

    if (error) {
      console.error(error);
      setMensaje('No se pudieron cargar los pagos.');
      setPagos([]);
    } else {
      setPagos(data || []);
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarPagos();
  }, []);

  const pagosNormalizados = useMemo(() => pagos.map((pago) => ({
    ...pago,
    paciente: pago.pacientes?.nombre_paciente || `Paciente ${pago.paciente_id}`,
    responsable: pago.pacientes?.nombre_responsable || 'No registrado',
    telefono: pago.pacientes?.telefono || '',
    correo: pago.pacientes?.correo || ''
  })), [pagos]);

  const pagosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return pagosNormalizados.filter((pago) => {
      const dentroRango = (!rango.inicio || pago.fecha_pago >= rango.inicio)
        && (!rango.fin || pago.fecha_pago <= rango.fin);

      if (!dentroRango) return false;
      if (!texto) return true;

      return [
        pago.paciente,
        pago.responsable,
        pago.telefono,
        pago.correo,
        pago.fecha_pago,
        pago.fecha_terapia
      ].join(' ').toLowerCase().includes(texto);
    });
  }, [busqueda, pagosNormalizados, rango]);

  const totales = useMemo(() => {
    const semana = inicioSemana(new Date());
    const quincena = inicioQuincena(new Date());
    const mes = inicioMes(new Date());

    return pagosNormalizados.reduce((acc, pago) => {
      const cantidad = Number(pago.cantidad || 0);
      const fecha = pago.fecha_pago;

      if (fecha === hoy) acc.dia += cantidad;
      if (fecha >= semana && fecha <= hoy) acc.semana += cantidad;
      if (fecha >= quincena && fecha <= hoy) acc.quincena += cantidad;
      if (fecha >= mes && fecha <= hoy) acc.mes += cantidad;

      return acc;
    }, {
      dia: 0,
      semana: 0,
      quincena: 0,
      mes: 0,
      rango: pagosFiltrados.reduce((total, pago) => total + Number(pago.cantidad || 0), 0)
    });
  }, [hoy, pagosFiltrados, pagosNormalizados]);

  return (
    <main className="container finances-page">
      <header className="finances-header">
        <div>
          <span className="patients-eyebrow">Administración financiera</span>
          <h1>Finanzas</h1>
          <p className="subtitle">
            Consulta pagos registrados, acumulados de ingresos y genera reportes PDF.
          </p>
        </div>

        <button
          type="button"
          onClick={() => generarReporteFinanzasPDF({
            pagos: pagosFiltrados,
            totales,
            rango
          })}
          disabled={pagosFiltrados.length === 0}
        >
          Generar PDF
        </button>
      </header>

      <section className="finances-kpis">
        <article><span>Hoy</span><strong>{formatoPesos.format(totales.dia)}</strong></article>
        <article><span>Semana</span><strong>{formatoPesos.format(totales.semana)}</strong></article>
        <article><span>Quincena</span><strong>{formatoPesos.format(totales.quincena)}</strong></article>
        <article><span>Mes</span><strong>{formatoPesos.format(totales.mes)}</strong></article>
      </section>

      <section className="finances-filters">
        <label>
          Buscar pago
          <input
            type="search"
            placeholder="Paciente, responsable, teléfono, correo o fecha..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </label>

        <label>
          Desde
          <input
            type="date"
            value={rango.inicio}
            onChange={(event) => setRango((actual) => ({ ...actual, inicio: event.target.value }))}
          />
        </label>

        <label>
          Hasta
          <input
            type="date"
            value={rango.fin}
            onChange={(event) => setRango((actual) => ({ ...actual, fin: event.target.value }))}
          />
        </label>
      </section>

      <div className="finances-total-range">
        <span>Total del rango visible</span>
        <strong>{formatoPesos.format(totales.rango)}</strong>
      </div>

      {mensaje && <p className="admin-message">{mensaje}</p>}
      {cargando && <p className="empty">Cargando pagos...</p>}

      <div className="table-container users-table-container">
        <table className="responsive-admin-table">
          <thead>
            <tr>
              <th>Fecha de pago</th>
              <th>Paciente</th>
              <th>Responsable</th>
              <th>Fecha de terapia</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {pagosFiltrados.map((pago) => (
              <tr key={pago.id}>
                <td data-label="Fecha de pago">{pago.fecha_pago}</td>
                <td data-label="Paciente">{pago.paciente}</td>
                <td data-label="Responsable">{pago.responsable}</td>
                <td data-label="Terapia">
                  {pago.fecha_terapia}
                  {pago.reagendada && pago.fecha_reagenda
                    ? ` / Reagendada: ${pago.fecha_reagenda}`
                    : ''}
                </td>
                <td data-label="Cantidad">{formatoPesos.format(Number(pago.cantidad || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!cargando && pagosFiltrados.length === 0 && (
        <p className="empty">No hay pagos registrados para esta búsqueda.</p>
      )}
    </main>
  );
}

export default Finanzas;
