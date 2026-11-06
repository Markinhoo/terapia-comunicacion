import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import PaginationControls from '../components/PaginationControls';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { useClinica } from '../contexts/clinica';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';

import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

function Servicios() {
  const clinica = useClinica();
  const [servicios, setServicios] = useState([]);
  const [totalCitas, setTotalCitas] = useState(0);
  const [catalogo, setCatalogo] = useState([]);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [mensaje, setMensaje] = useState('');

  const cargarCatalogo = useCallback(async () => {
    const { data, error } = await supabase.from('servicios_clinica').select('*')
      .eq('clinica_id', clinica.id).order('orden');
    if (!error) setCatalogo(data || []);
  }, [clinica.id]);

  const agregarServicio = async (event) => {
    event.preventDefault();
    const { error } = await supabase.from('servicios_clinica').insert({
      clinica_id: clinica.id,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      orden: catalogo.length
    });
    if (error) { setMensaje(error.message); return; }
    setForm({ nombre: '', descripcion: '' });
    setMensaje('Servicio agregado.');
    cargarCatalogo();
  };

  const cambiarActivo = async (item) => {
    const { error } = await supabase.from('servicios_clinica')
      .update({ activo: !item.activo }).eq('id', item.id).eq('clinica_id', clinica.id);
    if (error) { setMensaje(error.message); return; }
    cargarCatalogo();
  };

  const guardarServicio = async (event, item) => {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    const { error } = await supabase.from('servicios_clinica').update({
      nombre: String(datos.get('nombre') || '').trim(),
      descripcion: String(datos.get('descripcion') || '').trim() || null
    }).eq('id', item.id).eq('clinica_id', clinica.id);
    setMensaje(error ? error.message : 'Servicio actualizado.');
    if (!error) cargarCatalogo();
  };

  const obtenerServicios = useCallback(async () => {
    const { data, error } = await supabase
      .from('citas')
      .select('servicio');

    if (error) {
      console.error(error);
      return;
    }

    const conteo = {};

    data.forEach((cita) => {
      if (!cita.servicio) return;

      conteo[cita.servicio] =
        (conteo[cita.servicio] || 0) + 1;
    });

    const resultado = Object.entries(conteo)
      .map(([servicio, total]) => ({
        servicio,
        total
      }))
      .sort((a, b) => b.total - a.total);

    setServicios(resultado);
    setTotalCitas(data.length);
  }, []);

  useEffect(() => {
    obtenerServicios();
    cargarCatalogo();
  }, [obtenerServicios, cargarCatalogo]);

  const serviciosPagination = usePaginatedList(servicios, 5, servicios.length);

  const chartData = {
    labels: servicios.map((item) => item.servicio),

    datasets: [
      {
        label: 'Citas',
        data: servicios.map((item) => item.total),

        backgroundColor: '#6b4f9b',
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false
      }
    },

    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div>

      <section className="dashboard-section">
        <h2>Servicios de {clinica.nombre}</h2>
        {mensaje && <p role="status">{mensaje}</p>}
        <form className="form platform-form" onSubmit={agregarServicio}>
          <label>Nombre<input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required /></label>
          <label>Descripción<textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></label>
          <button type="submit">Agregar servicio</button>
        </form>
        <div className="platform-grid">
          {catalogo.map((item) => <article className="dashboard-section" key={item.id}>
            <form className="platform-form" onSubmit={(event) => guardarServicio(event, item)}>
              <label>Nombre<input name="nombre" defaultValue={item.nombre} required /></label>
              <label>Descripción<textarea name="descripcion" defaultValue={item.descripcion || ''} /></label>
              <button type="submit">Guardar</button>
            </form>
            <button type="button" onClick={() => cambiarActivo(item)}>{item.activo ? 'Ocultar' : 'Activar'}</button>
          </article>)}
        </div>
      </section>

      <div className="servicios-resumen">

        <div className="servicio-kpi">
          <span>{totalCitas}</span>
          <p>Total de citas</p>
        </div>

        <div className="servicio-kpi">
          <span>{servicios.length}</span>
          <p>Servicios distintos</p>
        </div>

        <div className="servicio-kpi">
          <span>
            {servicios[0]?.servicio || '-'}
          </span>

          <p>Servicio principal</p>
        </div>

      </div>

      <div className="servicios-layout">

        <section className="chart-card">

          <h2>
            Servicios más solicitados
          </h2>

          <div className="chart-container">

            <Bar
              data={chartData}
              options={chartOptions}
            />

          </div>

        </section>

        <section className="chart-card">

          <h2>
            Distribución
          </h2>

          <div className="table-container users-table-container">

            <table className="responsive-admin-table">

              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Total</th>
                  <th>%</th>
                </tr>
              </thead>

              <tbody>

                {serviciosPagination.paginatedItems.map((item) => (

                  <tr key={item.servicio}>

                    <td data-label="Servicio">
                      {item.servicio}
                    </td>

                    <td data-label="Total">
                      {item.total}
                    </td>

                    <td data-label="%">
                      {
                        (
                          (item.total / totalCitas) *
                          100
                        ).toFixed(1)
                      }%
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <PaginationControls
            page={serviciosPagination.page}
            totalPages={serviciosPagination.totalPages}
            totalItems={servicios.length}
            onPageChange={serviciosPagination.setPage}
          />

        </section>

      </div>

    </div>
  );
}

export default Servicios;
