import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { etiquetaRol } from '../utils/roles';
import PaginationControls from '../components/PaginationControls';
import { usePaginatedList } from '../hooks/usePaginatedList';

function AccordionSection({ id, title, total, openSection, setOpenSection, children }) {
  const open = openSection === id;

  return (
    <section className={`dashboard-section user-list-accordion ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="user-accordion-header"
        onClick={() => setOpenSection(open ? null : id)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <small>{total} registro{total === 1 ? '' : 's'}</small>
        <strong>{open ? '-' : '+'}</strong>
      </button>

      {open && (
        <div className="user-accordion-content">
          {children}
        </div>
      )}
    </section>
  );
}

function coincideBusqueda(valores, busqueda) {
  const termino = busqueda.trim().toLowerCase();

  if (!termino) return true;

  return valores
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(termino);
}

function UsuariosAdmin() {
  const [perfiles, setPerfiles] = useState([]);
  const [bitacora, setBitacora] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', role: 'user' });
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [busquedaPerfiles, setBusquedaPerfiles] = useState('');
  const [busquedaBitacora, setBusquedaBitacora] = useState('');
  const [usuarioPassword, setUsuarioPassword] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmacion: ''
  });
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [mobilePageSize, setMobilePageSize] = useState(() => (
    window.innerWidth <= 620 ? 1 : 5
  ));

  async function cargarDatos() {
    const [
      { data: perfilesData, error: errorPerfiles },
      { data: bitacoraData }
    ] =
      await Promise.all([
        supabase
          .from('app_profiles')
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
    setBitacora(bitacoraData || []);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const actualizarTamanoPagina = () => {
      setMobilePageSize(window.innerWidth <= 620 ? 1 : 5);
    };

    window.addEventListener('resize', actualizarTamanoPagina);

    return () => window.removeEventListener('resize', actualizarTamanoPagina);
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

  const eliminarUsuario = async (perfil) => {
    const confirmar = window.confirm(
      `¿Deseas eliminar definitivamente a ${perfil.email}? Esta acción quitará su acceso.`
    );

    if (!confirmar) return;

    setMensaje('');
    const { error } = await supabase.functions.invoke('crear-usuario-admin', {
      body: {
        action: 'delete_user',
        user_id: perfil.id
      }
    });

    if (error) {
      setMensaje(error.message || 'No se pudo eliminar el usuario.');
      return;
    }

    setMensaje(`Usuario ${perfil.email} eliminado correctamente.`);
    cargarDatos();
  };

  const abrirCambioPassword = (perfil) => {
    setUsuarioPassword(perfil);
    setPasswordForm({ password: '', confirmacion: '' });
    setMensaje('');
  };

  const cerrarCambioPassword = () => {
    setUsuarioPassword(null);
    setPasswordForm({ password: '', confirmacion: '' });
  };

  const cambiarPassword = async (event) => {
    event.preventDefault();
    setMensaje('');

    if (passwordForm.password.length < 8) {
      setMensaje('La nueva contrasena debe tener al menos 8 caracteres.');
      return;
    }

    if (passwordForm.password !== passwordForm.confirmacion) {
      setMensaje('Las contrasenas no coinciden.');
      return;
    }

    setCambiandoPassword(true);

    const { error } = await supabase.functions.invoke('crear-usuario-admin', {
      body: {
        action: 'update_password',
        user_id: usuarioPassword.id,
        password: passwordForm.password
      }
    });

    setCambiandoPassword(false);

    if (error) {
      setMensaje(error.message || 'No se pudo cambiar la contrasena.');
      return;
    }

    setMensaje(`Contrasena actualizada para ${usuarioPassword.email}.`);
    cerrarCambioPassword();
  };

  const perfilesFiltrados = perfiles.filter((perfil) => coincideBusqueda([
    perfil.email,
    etiquetaRol(perfil.role),
    perfil.active ? 'Activo' : 'Inactivo'
  ], busquedaPerfiles));

  const bitacoraFiltrada = bitacora.filter((item) => coincideBusqueda([
    item.created_at ? new Date(item.created_at).toLocaleString() : '',
    item.usuario_email,
    item.usuario_id,
    item.tabla,
    item.accion,
    item.registro_id,
    item.descripcion
  ], busquedaBitacora));

  const perfilesPagination = usePaginatedList(
    perfilesFiltrados,
    mobilePageSize,
    `${busquedaPerfiles}-${mobilePageSize}-${perfiles.length}`
  );
  const bitacoraPagination = usePaginatedList(
    bitacoraFiltrada,
    mobilePageSize,
    `${busquedaBitacora}-${mobilePageSize}-${bitacora.length}`
  );

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

      <AccordionSection
        id="perfiles"
        title="Usuarios existentes"
        total={perfilesFiltrados.length}
        openSection={openSection}
        setOpenSection={setOpenSection}
      >
        <label className="section-search">
          Buscar en usuarios existentes
          <input
            type="search"
            value={busquedaPerfiles}
            onChange={(event) => setBusquedaPerfiles(event.target.value)}
            placeholder="Correo, rol o estado..."
          />
        </label>

        {usuarioPassword && (
          <form className="password-admin-card" onSubmit={cambiarPassword}>
            <div>
              <span>Cambiar contrasena</span>
              <strong>{usuarioPassword.email}</strong>
            </div>

            <label>
              Nueva contrasena
              <input
                type="password"
                minLength="8"
                value={passwordForm.password}
                onChange={(event) => setPasswordForm({
                  ...passwordForm,
                  password: event.target.value
                })}
                autoComplete="new-password"
                required
              />
            </label>

            <label>
              Confirmar contrasena
              <input
                type="password"
                minLength="8"
                value={passwordForm.confirmacion}
                onChange={(event) => setPasswordForm({
                  ...passwordForm,
                  confirmacion: event.target.value
                })}
                autoComplete="new-password"
                required
              />
            </label>

            <div className="password-admin-actions">
              <button type="submit" disabled={cambiandoPassword}>
                {cambiandoPassword ? 'Actualizando...' : 'Guardar contrasena'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={cerrarCambioPassword}
                disabled={cambiandoPassword}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="table-container users-table-container">
          <table className="responsive-admin-table">
            <thead>
              <tr>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {perfilesPagination.paginatedItems.map((perfil) => (
                <tr key={perfil.id}>
                  <td data-label="Correo">{perfil.email}</td>
                  <td data-label="Rol">{etiquetaRol(perfil.role)}</td>
                  <td data-label="Estado">{perfil.active ? 'Activo' : 'Inactivo'}</td>
                  <td data-label="Acciones">
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
                      <button
                        type="button"
                        onClick={() => abrirCambioPassword(perfil)}
                      >
                        Cambiar contrasena
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => eliminarUsuario(perfil)}
                      >
                        Eliminar usuario
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {perfilesFiltrados.length === 0 && (
          <p className="empty">No se encontraron usuarios.</p>
        )}

        <PaginationControls
          page={perfilesPagination.page}
          totalPages={perfilesPagination.totalPages}
          totalItems={perfilesFiltrados.length}
          onPageChange={perfilesPagination.setPage}
        />
      </AccordionSection>

      <AccordionSection
        id="bitacora"
        title="Bitácora de cambios recientes"
        total={bitacoraFiltrada.length}
        openSection={openSection}
        setOpenSection={setOpenSection}
      >
        <p className="subtitle">
          Últimos movimientos importantes registrados en tablas clínicas y administrativas.
        </p>

        <label className="section-search">
          Buscar en bitácora
          <input
            type="search"
            value={busquedaBitacora}
            onChange={(event) => setBusquedaBitacora(event.target.value)}
            placeholder="Usuario, tabla, acción, descripción, registro o fecha..."
          />
        </label>

        {bitacora.length === 0 && (
          <p className="empty">No hay movimientos registrados.</p>
        )}

        <div className="table-container users-table-container">
          <table className="responsive-admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Tabla</th>
                <th>Acción</th>
                <th>Descripción</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {bitacoraPagination.paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td data-label="Fecha">{new Date(item.created_at).toLocaleString()}</td>
                  <td data-label="Usuario">{item.usuario_email || item.usuario_id || 'Sistema'}</td>
                  <td data-label="Tabla">{item.tabla}</td>
                  <td data-label="Acción">{item.accion}</td>
                  <td data-label="Descripción">
                    {item.descripcion || item.cambios?.descripcion || '-'}
                  </td>
                  <td data-label="Registro">{item.registro_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bitacora.length > 0 && bitacoraFiltrada.length === 0 && (
          <p className="empty">No se encontraron movimientos.</p>
        )}

        <PaginationControls
          page={bitacoraPagination.page}
          totalPages={bitacoraPagination.totalPages}
          totalItems={bitacoraFiltrada.length}
          onPageChange={bitacoraPagination.setPage}
        />
      </AccordionSection>
    </main>
  );
}

export default UsuariosAdmin;
