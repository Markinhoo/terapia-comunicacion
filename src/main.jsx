import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

import './styles/global.css';
import './styles/navbar.css';
import './styles/home.css';
import './styles/forms.css';
import './styles/tables.css';
import './styles/dashboard.css';
import './styles/sidebar.css';
import './styles/expediente.css';
import './styles/whatsapp.css';
import './styles/responsive.css';
import './styles/servicios.css';
import './styles/calendar.css';
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
