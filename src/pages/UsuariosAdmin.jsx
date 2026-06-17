import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { etiquetaRol } from '../utils/roles';

function UsuariosAdmin() {
  const [perfiles, setPerfiles] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [bitacora, setBitacora] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', role: 'user' });
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  async function cargarDatos() {
    const [
      { data: perfilesData, error: errorPerfiles },
      { data: invitacionesData },
      { data: bitacoraData }
    ] =
      await Promise.all([
        supabase
          .from('app_profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('invitaciones_usuario')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('bitacora_cambios')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30)
      ]);

    if (errorPerfiles) {
      setMensaje('No se pudieron cargar los usuarios.');
      console.error(errorPerfiles);
      return;
    }

    setPerfiles(perfilesData || []);
    setInvitaciones(invitacionesData || []);
    setBitacora(bitacoraData || []);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const registrarUsuario = async (event) => {
    event.preventDefault();
    setMensaje('');
    setCargando(true);

    const { error } = await supabase.functions.invoke('crear-usuario-admin', {
      body: {
        email: form.email,
        password: form.password,
        role: form.role
      }
    });

    setCargando(false);

    if (error) {
      setMensaje(error.message || 'No se pudo registrar el usuario.');
      return;
    }

    setMensaje('Usuario creado correctamente. Ya puede iniciar sesion con el correo y contrasena asignados.');
    setForm({ email: '', password: '', role: 'user' });
    cargarDatos();
  };

  const cambiarRol = async (perfil, role, active = perfil.active) => {
    setMensaje('');

    const { error } = await supabase.rpc('actualizar_rol_usuario', {
      p_user_id: perfil.id,
      p_role: role,
      p_active: active
    });

    if (error) {
      setMensaje(error.message || 'No se pudo actualizar el usuario.');
      return;
    }

    cargarDatos();
  };

  return (
    <main className="container">
      <section className="dashboard-section">
        <h1>Usuarios y permisos</h1>
        <p className="subtitle">
          Define quien puede administrar y quien solo puede consultar la informacion.
        </p>

        {mensaje && <p className="admin-message">{mensaje}</p>}

        <form className="form user-admin-form" onSubmit={registrarUsuario}>
          <label className="form-field">
            <span>Correo del nuevo usuario</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="usuario@correo.com"
              required
            />
            <small>
              Solo el administrador maestro puede crear usuarios desde esta pantalla.
            </small>
          </label>

          <label className="form-field">
            <span>Contrasena temporal</span>
            <input
              type="password"
              minLength="8"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Minimo 8 caracteres"
              required
            />
            <small>El usuario podra iniciar sesion con esta contrasena.</small>
          </label>

          <label className="form-field">
            <span>Privilegios</span>
            <select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              <option value="master_admin">Administrador maestro - crea usuarios y administra todo</option>
              <option value="admin">Administrador - puede editar, no crear usuarios</option>
              <option value="user">Usuario normal - solo lectura</option>
            </select>
          </label>

          <button type="submit" disabled={cargando}>
            {cargando ? 'Registrando...' : 'Registrar usuario'}
          </button>
        </form>
      </section>

      <section className="dashboard-section">
        <h2>Usuarios existentes</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {perfiles.map((perfil) => (
                <tr key={perfil.id}>
                  <td>{perfil.email}</td>
                  <td>{etiquetaRol(perfil.role)}</td>
                  <td>{perfil.active ? 'Activo' : 'Inactivo'}</td>
                  <td>
                    <div className="acciones">
                      <button
                        type="button"
                        onClick={() => cambiarRol(perfil, 'master_admin')}
                        disabled={perfil.role === 'master_admin'}
                      >
                        Maestro
                      </button>
                      <button
                        type="button"
                        onClick={() => cambiarRol(perfil, 'admin')}
                        disabled={perfil.role === 'admin'}
                      >
                        Hacer admin
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => cambiarRol(perfil, 'user')}
                        disabled={perfil.role === 'user'}
                      >
                        Solo lectura
                      </button>
                      <button
                        type="button"
                        className={perfil.active ? 'btn-danger' : 'btn-secondary'}
                        onClick={() => cambiarRol(perfil, perfil.role, !perfil.active)}
                      >
                        {perfil.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Registros pendientes</h2>

        {invitaciones.length === 0 && (
          <p className="empty">No hay usuarios pendientes.</p>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Correo</th>
                <th>Rol solicitado</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {invitaciones.map((item) => (
                <tr key={item.id}>
                  <td>{item.email}</td>
                  <td>{etiquetaRol(item.role)}</td>
                  <td>{item.estado}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Bitacora de cambios recientes</h2>
        <p className="subtitle">
          Ultimos movimientos registrados en tablas clinicas y administrativas.
        </p>

        {bitacora.length === 0 && (
          <p className="empty">No hay movimientos registrados.</p>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Tabla</th>
                <th>Accion</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {bitacora.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                  <td>{item.usuario_email || item.usuario_id || 'Sistema'}</td>
                  <td>{item.tabla}</td>
                  <td>{item.accion}</td>
                  <td>{item.registro_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default UsuariosAdmin;
