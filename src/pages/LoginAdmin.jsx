import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const personajes = [
  { forma: 'square', color: 'violet', nombre: 'Cuadrado' },
  { forma: 'circle', color: 'coral', nombre: 'Circulo' },
  { forma: 'oval', color: 'mint', nombre: 'Ovalo' }
];

function Personaje({ forma, color, nombre, estado, mirada }) {
  const estiloMirada = {
    '--eye-x': `${mirada.x}px`,
    '--eye-y': `${mirada.y}px`
  };

  return (
    <div
      className={`login-character character-${forma} character-${color} ${estado}`}
      aria-label={nombre}
      role="img"
    >
      <span className="character-shadow" />
      <span className="character-body">
        <span className="character-face" style={estiloMirada}>
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
  const [mirada, setMirada] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const location = useLocation();

  const actualizarMirada = (event) => {
    if (passwordActivo || mostrarPassword || negando) return;

    const area = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - area.left) / area.width - 0.5) * 8;
    const y = ((event.clientY - area.top) / area.height - 0.5) * 7;

    setMirada({
      x: Math.max(-4, Math.min(4, x)),
      y: Math.max(-3.5, Math.min(3.5, y))
    });
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
    setEnviando(true);
    setMensaje('');
    setNegando(false);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMensaje('Correo o contrasena incorrectos.');
      setEnviando(false);
      setNegando(true);
      window.setTimeout(() => setNegando(false), 900);
      return;
    }

    const destino = location.state?.from?.pathname || '/admin';
    navigate(destino, { replace: true });
  };

  return (
    <main
      className="login-page"
      onPointerMove={actualizarMirada}
      onPointerLeave={() => setMirada({ x: 0, y: 0 })}
    >
      <section className="login-experience" aria-labelledby="login-title">
        <div className="login-characters" aria-label="Personajes del acceso">
          {personajes.map((personaje) => (
            <Personaje
              key={personaje.forma}
              {...personaje}
              estado={estadoPersonajes}
              mirada={mirada}
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
                  placeholder="Escribe tu contrasena"
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
                    mostrarPassword ? 'Ocultar contrasena' : 'Ver contrasena'
                  }
                  aria-pressed={mostrarPassword}
                >
                  {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </span>
            </label>

            <button type="submit" disabled={enviando}>
              {enviando ? 'Ingresando...' : 'Iniciar sesion'}
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
