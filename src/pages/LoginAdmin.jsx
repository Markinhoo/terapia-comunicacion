import { useEffect, useRef, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const personajes = [
  { forma: 'arch', color: 'orange', nombre: 'Semicirculo', intensidad: 0.55 },
  { forma: 'tower', color: 'violet', nombre: 'Figura morada', intensidad: 1 },
  { forma: 'slab', color: 'ink', nombre: 'Figura negra', intensidad: 0.82 },
  { forma: 'bean', color: 'yellow', nombre: 'Figura amarilla', intensidad: 0.68 }
];

const MAX_INTENTOS_LOGIN = 5;
const BLOQUEO_LOGIN_MS = 5 * 60 * 1000;

function Personaje({ forma, color, nombre, estado, intensidad }) {
  return (
    <div
      className={`login-character character-${forma} character-${color} ${estado}`}
      style={{ '--intensity': intensidad }}
      aria-label={nombre}
      role="img"
    >
      <span className="character-shadow" />
      <span className="character-body">
        <span className="character-face">
          <span className="character-eye character-eye-left">
            <span className="character-pupil" />
          </span>
          <span className="character-eye character-eye-right">
            <span className="character-pupil" />
          </span>
          <span className="character-mouth" />
        </span>
      </span>
    </div>
  );
}

function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [passwordActivo, setPasswordActivo] = useState(false);
  const [negando, setNegando] = useState(false);
  const loginPageRef = useRef(null);
  const cursorObjetivo = useRef({ x: 0, y: 0 });
  const cursorActual = useRef({ x: 0, y: 0 });
  const navigate = useNavigate();
  const location = useLocation();

  const obtenerBloqueoLogin = () => {
    const bloqueoHasta = Number(window.localStorage.getItem('admin_login_bloqueado_hasta') || 0);
    return bloqueoHasta > Date.now() ? bloqueoHasta : 0;
  };

  useEffect(() => {
    let frameId;

    const animar = () => {
      const actual = cursorActual.current;
      const objetivo = cursorObjetivo.current;

      actual.x += (objetivo.x - actual.x) * 0.11;
      actual.y += (objetivo.y - actual.y) * 0.11;

      if (loginPageRef.current) {
        loginPageRef.current.style.setProperty('--cursor-x', actual.x.toFixed(4));
        loginPageRef.current.style.setProperty('--cursor-y', actual.y.toFixed(4));
        loginPageRef.current.style.setProperty('--eye-x', `${(actual.x * 9).toFixed(2)}px`);
        loginPageRef.current.style.setProperty('--eye-y', `${(actual.y * 6.5).toFixed(2)}px`);
        loginPageRef.current.style.setProperty('--face-x', `${(actual.x * 13).toFixed(2)}px`);
        loginPageRef.current.style.setProperty('--face-y', `${(actual.y * 7).toFixed(2)}px`);
        loginPageRef.current.style.setProperty('--lean-soft', `${(actual.x * -5).toFixed(2)}deg`);
        loginPageRef.current.style.setProperty('--lean-mid', `${(actual.x * -8).toFixed(2)}deg`);
        loginPageRef.current.style.setProperty('--lean-strong', `${(actual.x * -12).toFixed(2)}deg`);
        loginPageRef.current.style.setProperty('--stretch-soft', (1 - actual.y * 0.025).toFixed(4));
        loginPageRef.current.style.setProperty('--stretch-mid', (1 - actual.y * 0.045).toFixed(4));
        loginPageRef.current.style.setProperty('--stretch-strong', (1 - actual.y * 0.07).toFixed(4));
      }

      frameId = window.requestAnimationFrame(animar);
    };

    frameId = window.requestAnimationFrame(animar);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const actualizarMirada = (event) => {
    if (passwordActivo || mostrarPassword || negando) return;

    const area = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - area.left) / area.width - 0.5) * 2;
    const y = ((event.clientY - area.top) / area.height - 0.5) * 2;

    cursorObjetivo.current = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y))
    };
  };

  const estadoPersonajes = mostrarPassword
    ? 'eyes-closed'
    : negando
      ? 'saying-no'
      : passwordActivo
        ? 'looking-away'
        : 'following';

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
    setNegando(false);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

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
      setNegando(true);
      window.setTimeout(() => setNegando(false), 900);
      return;
    }

    window.localStorage.removeItem('admin_login_intentos');
    window.localStorage.removeItem('admin_login_bloqueado_hasta');
    const destino = location.state?.from?.pathname || '/admin';
    navigate(destino, { replace: true });
  };

  return (
    <main
      ref={loginPageRef}
      className="login-page"
      onPointerMove={actualizarMirada}
      onPointerLeave={() => {
        cursorObjetivo.current = { x: 0, y: 0 };
      }}
    >
      <section className="login-experience" aria-labelledby="login-title">
        <div className="login-characters" aria-label="Personajes del acceso">
          {personajes.map((personaje) => (
            <Personaje
              key={personaje.forma}
              {...personaje}
              estado={estadoPersonajes}
            />
          ))}
        </div>

        <div className="login-panel">
          <span className="login-eyebrow">Area privada</span>
          <h1 id="login-title">Acceso administrativo</h1>
          <p className="subtitle">
            Panel privado para consultar, confirmar y administrar citas.
          </p>

          <form className="form login-form" onSubmit={login}>
            <label className="login-field">
              <span>Correo</span>
              <input
                type="email"
                placeholder="Correo del administrador"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </label>

            <label className="login-field">
              <span>Contrasena</span>
              <span className="password-field">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  placeholder="Escribe tu contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onFocus={() => setPasswordActivo(true)}
                  onClick={() => setPasswordActivo(true)}
                  onKeyDown={() => setPasswordActivo(true)}
                  onBlur={() => setPasswordActivo(false)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarPassword((actual) => !actual)}
                  aria-label={
                    mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'
                  }
                  aria-pressed={mostrarPassword}
                >
                  {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </span>
            </label>

            <button type="submit" disabled={enviando}>
              {enviando ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
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




