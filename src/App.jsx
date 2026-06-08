import { Routes, Route, Link } from 'react-router-dom';
import Inicio from './pages/Inicio';
import AgendarCita from './pages/AgendarCita';
import LoginAdmin from './pages/LoginAdmin';
import PanelAdmin from './pages/PanelAdmin';
import CalendarioCitas from './pages/CalendarioCitas';
import Pacientes from './pages/Pacientes';
import ExpedienteClinico from './pages/ExpedienteClinico';
import WhatsAppFloat from './components/WhatsAppFloat';
import { useLocation } from 'react-router-dom';


function App() {

  const location = useLocation();
  return (
    <>
      <nav className="navbar">
        <div className="brand">
          <img src="/logo.png" alt="Clínica Casas" className="brand-logo" />
          <h2>Clínica Casas</h2>
        </div>
        
        <div>
          <Link to="/">Inicio</Link>
          <Link to="/agendar">Agendar cita</Link>
          <Link to="/login">Admin</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/agendar" element={<AgendarCita />} />
        <Route path="/login" element={<LoginAdmin />} />
        <Route path="/admin/*" element={<PanelAdmin />} />
        <Route path="/calendario" element={<CalendarioCitas />} />
        <Route path="/pacientes" element={<Pacientes />} />
        <Route path="/expediente/:pacienteId" element={<ExpedienteClinico />} />
      </Routes>

       {!location.pathname.startsWith('/admin') &&
        <WhatsAppFloat />
      }
    </>
  );
}

export default App;