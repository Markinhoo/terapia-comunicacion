import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ClinicaProvider } from './contexts/ClinicaContext';
import PlatformApp from './pages/PlatformApp';

import './styles/global.css';
import './styles/navbar.css';
import './styles/home.css';
import './styles/forms.css';
import './styles/tables.css';
import './styles/dashboard.css';
import './styles/sidebar.css';
import './styles/expediente.css';
import './styles/whatsapp.css';
import './styles/whatsapp-inbox.css';
import './styles/clinic-loader.css';
import './styles/responsive.css';
import './styles/servicios.css';
import './styles/calendar.css';
import './styles/theme.css';
import './styles/galeria.css';
import './styles/platform.css';
import './styles/clinic-login.css';

const slug = window.location.pathname.match(/^\/(clinica-[a-z0-9-]+)(?:\/|$)/)?.[1];

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter basename={slug ? `/${slug}` : undefined}>
    {slug ? <ClinicaProvider slug={slug}><App /></ClinicaProvider> : <PlatformApp />}
  </BrowserRouter>
);
