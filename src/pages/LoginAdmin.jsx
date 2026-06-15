import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const login = async (event) => {
    event.preventDefault();
    setEnviando(true);
    setMensaje('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMensaje('Correo o contrasena incorrectos.');
      setEnviando(false);
      return;
    }

    const destino = location.state?.from?.pathname || '/admin';
    navigate(destino, { replace: true });
  };

  return (
    <main className="container login-container">
      <h1>Acceso administrativo</h1>
      <p className="subtitle">
        Panel privado para consultar, confirmar y administrar citas.
      </p>

      <form className="form login-form" onSubmit={login}>
        <input
          type="email"
          placeholder="Correo del administrador"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contrasena"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit" disabled={enviando}>
          {enviando ? 'Ingresando...' : 'Iniciar sesion'}
        </button>
      </form>

      {mensaje && <p className="error">{mensaje}</p>}
    </main>
  );
}

export default LoginAdmin;
