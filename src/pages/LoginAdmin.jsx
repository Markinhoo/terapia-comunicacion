import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMensaje('Correo o contraseña incorrectos.');
    } else {
      navigate('/admin');
    }
  };

  return (
    <main className="container login-container">
      <h1>Acceso administrativo</h1>
      <p>Panel privado para consultar las citas agendadas.</p>

      <form className="form" onSubmit={login}>
        <input
          type="email"
          placeholder="Correo del administrador"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Iniciar sesión</button>
      </form>

      {mensaje && <p className="error">{mensaje}</p>}
    </main>
  );
}

export default LoginAdmin;