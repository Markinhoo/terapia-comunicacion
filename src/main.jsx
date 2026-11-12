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
import './styles/theme-switch.css';

const slug = window.location.pathname.match(/^\/(clinica-[a-z0-9-]+)(?:\/|$)/)?.[1];
const rutaClinica = slug ? window.location.pathname.slice(slug.length + 1) || '/' : '';

function precargarPagina(ruta) {
  if (ruta.startsWith('/admin')) {
    return Promise.all([import('./pages/PanelAdmin'), import('./pages/LoginAdmin')])
      .then(([admin, login]) => ({ pagina: admin.default, login: login.default }));
  }
  let modulo;
  switch (ruta) {
    case '/agendar': modulo = import('./pages/AgendarCita'); break;
    case '/galeria': modulo = import('./pages/Galeria'); break;
    case '/login': modulo = import('./pages/LoginAdmin'); break;
    case '/': modulo = import('./pages/Inicio'); break;
    default: return Promise.resolve({});
  }
  return modulo.then(({ default: pagina }) => ({ pagina }));
}

const paginaPreparada = slug ? precargarPagina(rutaClinica) : null;

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter basename={slug ? `/${slug}` : undefined}>
    {slug ? <ClinicaProvider slug={slug} paginaPreparada={paginaPreparada}>
      {(paginaInicial) => <App paginaInicial={paginaInicial} rutaInicial={rutaClinica} />}
    </ClinicaProvider> : <PlatformApp />}
  </BrowserRouter>
);
