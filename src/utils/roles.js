export const ROLES = {
  MASTER: 'master_admin',
  ADMIN: 'admin',
  USER: 'user'
};

export function puedeVerRuta(role, ruta) {
  if (role === ROLES.MASTER) return true;

  if (role === ROLES.ADMIN) {
    return !ruta.startsWith('usuarios');
  }

  return ruta === '' || ruta.startsWith('calendario');
}

export function etiquetaRol(role) {
  if (role === ROLES.MASTER) return 'Administrador maestro';
  if (role === ROLES.ADMIN) return 'Administrador';
  return 'Usuario normal';
}
