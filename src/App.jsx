import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Inicio from './pages/Inicio';
import AgendarCita from './pages/AgendarCita';
import LoginAdmin from './pages/LoginAdmin';
import PanelAdmin from './pages/PanelAdmin';
import ProtectedRoute from './components/ProtectedRoute';
import WhatsAppFloat from './components/WhatsAppFloat';


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
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <PanelAdmin />
            </ProtectedRoute>
          }
        />
      </Routes>

       {!location.pathname.startsWith('/admin') &&  location.pathname !== '/login' &&
        <WhatsAppFloat />
      }
    </>
  );
}

export default App;
