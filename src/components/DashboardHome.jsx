function DashboardHome() {
  return (
    <div>

      <h1>Dashboard General</h1>

      <div className="cards-grid">

        <div className="card-kpi">
          <h3>Pacientes</h3>
          <span>0</span>
        </div>

        <div className="card-kpi">
          <h3>Citas del mes</h3>
          <span>0</span>
        </div>

        <div className="card-kpi">
          <h3>Nuevos pacientes</h3>
          <span>0</span>
        </div>

        <div className="card-kpi">
          <h3>Servicios</h3>
          <span>0</span>
        </div>

      </div>

      <div className="dashboard-section">
        <h2>Próximas citas</h2>

        <p>
          Aquí aparecerán las próximas citas.
        </p>
      </div>

    </div>
  );
}

export default DashboardHome;