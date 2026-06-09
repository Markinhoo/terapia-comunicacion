import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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
  const [servicios, setServicios] = useState([]);
  const [totalCitas, setTotalCitas] = useState(0);

  useEffect(() => {
    obtenerServicios();
  }, []);

  const obtenerServicios = async () => {
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
  };

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

          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Total</th>
                  <th>%</th>
                </tr>
              </thead>

              <tbody>

                {servicios.map((item) => (

                  <tr key={item.servicio}>

                    <td>
                      {item.servicio}
                    </td>

                    <td>
                      {item.total}
                    </td>

                    <td>
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

        </section>

      </div>

    </div>
  );
}

export default Servicios;