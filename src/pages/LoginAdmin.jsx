import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useClinica } from '../contexts/clinica';
import ClinicLoader, { ClinicBrandMark } from '../components/ClinicLoader';

const MAX_INTENTOS_LOGIN = 5;
const BLOQUEO_LOGIN_MS = 5 * 60 * 1000;

function LoginAdmin() {
  const clinica = useClinica();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const obtenerBloqueoLogin = () => {
    const bloqueoHasta = Number(window.localStorage.getItem('admin_login_bloqueado_hasta') || 0);
    return bloqueoHasta > Date.now() ? bloqueoHasta : 0;
  };

  const login = async (event) => {
    event.preventDefault();
    const bloqueoHasta = obtenerBloqueoLogin();

    if (bloqueoHasta) {
      const minutos = Math.ceil((bloqueoHasta - Date.now()) / 60000);
      setMensaje(`Demasiados intentos fallidos. Intenta de nuevo en ${minutos} minuto${minutos === 1 ? '' : 's'}.`);
      return;
    }

    setEnviando(true);
    setMensaje('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const intentos = Number(window.localStorage.getItem('admin_login_intentos') || 0) + 1;
      window.localStorage.setItem('admin_login_intentos', String(intentos));

      if (intentos >= MAX_INTENTOS_LOGIN) {
        const bloqueo = Date.now() + BLOQUEO_LOGIN_MS;
        window.localStorage.setItem('admin_login_bloqueado_hasta', String(bloqueo));
        window.localStorage.setItem('admin_login_intentos', '0');
        setMensaje('Demasiados intentos fallidos. El acceso quedó bloqueado por 5 minutos.');
      } else {
        setMensaje(`Correo o contraseña incorrectos. Intento ${intentos} de ${MAX_INTENTOS_LOGIN}.`);
      }

      setEnviando(false);
      return;
    }

    window.localStorage.removeItem('admin_login_intentos');
    window.localStorage.removeItem('admin_login_bloqueado_hasta');
    const destino = location.state?.from?.pathname || '/admin';
    navigate(destino, { replace: true });
  };

  return (
    <main className="login-page">
      <section className="login-experience" aria-labelledby="login-title">
        <div className="login-brand-panel">
          <span className="login-brand-kicker">Bienvenido a</span>
          <ClinicBrandMark clinica={clinica} className="login-brand-logo" />
          <h2>{clinica.nombre}</h2>
          {clinica.subtitulo && <p>{clinica.subtitulo}</p>}
          <span className="login-brand-line" aria-hidden="true" />
          <small>Un espacio para cuidar cada encuentro.</small>
        </div>

        <div className="login-panel">
          {enviando && <ClinicLoader clinica={clinica} label="Iniciando sesión..." overlay />}
          <span className="login-eyebrow">Área privada</span>
          <h1 id="login-title">Acceso administrativo</h1>
          <p className="subtitle">Panel privado para consultar, confirmar y administrar citas.</p>

          <form className="form login-form" onSubmit={login}>
            <label className="login-field">
              <span>Correo</span>
              <input type="email" placeholder="Correo del administrador" value={email}
                onChange={(event) => setEmail(event.target.value)} autoComplete="username" required />
            </label>

            <label className="login-field">
              <span>Contraseña</span>
              <span className="password-field">
                <input type={mostrarPassword ? 'text' : 'password'} placeholder="Escribe tu contraseña"
                  value={password} onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password" required />
                <button type="button" className="password-toggle"
                  onClick={() => setMostrarPassword((actual) => !actual)}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-pressed={mostrarPassword}>
                  {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </span>
            </label>

            <button type="submit" disabled={enviando}>{enviando ? 'Ingresando...' : 'Iniciar sesión'}</button>
          </form>

          <div className="login-feedback" aria-live="polite">
            {mensaje && <p className="error">{mensaje}</p>}
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginAdmin;
