import { Routes, Route, Link } from 'react-router-dom';
import Inicio from './pages/Inicio';
import AgendarCita from './pages/AgendarCita';
import LoginAdmin from './pages/LoginAdmin';
import PanelAdmin from './pages/PanelAdmin';

function App() {
  return (
    <>
      <nav className="navbar">
        <h2>ComunicaTerapia</h2>
        <div>
          <Link to="/">Inicio</Link>
          <Link to="/agendar">Agendar valoración</Link>
          <Link to="/login">Admin</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/agendar" element={<AgendarCita />} />
        <Route path="/login" element={<LoginAdmin />} />
        <Route path="/admin" element={<PanelAdmin />} />
      </Routes>
    </>
  );
}

export default App;