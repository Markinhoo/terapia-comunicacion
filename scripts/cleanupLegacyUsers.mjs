import { createClient } from '@supabase/supabase-js';

const keeperEmail = 'markos_ff7@hotmail.com';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const execute = process.argv.includes('--delete');
const confirmed = process.argv.includes(`--confirm-email=${keeperEmail}`);

if (!url || !key) {
  throw new Error('Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.');
}
if (execute && !confirmed) {
  throw new Error(`Para borrar, agrega --confirm-email=${keeperEmail}.`);
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { data: clinics, error: clinicError } = await client.from('clinicas').select('slug');
if (clinicError) throw clinicError;
if (clinics.length !== 1 || clinics[0].slug !== 'clinica-evocare') {
  throw new Error('La limpieza solo se permite cuando Evocaré es la única clínica.');
}

for (const table of [
  'pacientes', 'citas', 'paciente_detalle', 'expedientes',
  'paciente_objetivos', 'objetivos_terapeuticos', 'archivos_paciente',
  'sesiones_paciente', 'envios_reglamento', 'galeria_terapias',
  'galeria_likes', 'invitaciones_usuario', 'bitacora_cambios'
]) {
  const { count, error } = await client.from(table)
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  if (count !== 0) {
    throw new Error(`La tabla ${table} aún contiene ${count} registros; ejecuta primero la limpieza SQL.`);
  }
}

const { data: profilesBefore, error: profileError } = await client.from('app_profiles')
  .select('id, email, role, active, plataforma_admin, clinica_id')
  .order('id');
if (profileError) throw profileError;
const matchingProfiles = profilesBefore.filter((item) => item.email?.trim().toLowerCase() === keeperEmail);
const profile = matchingProfiles.length === 1 ? matchingProfiles[0] : null;
if (!profile || profile.role !== 'master_admin' || !profile.active ||
    !profile.plataforma_admin || profile.clinica_id !== null) {
  throw new Error('La cuenta que se conservará debe ser el administrador activo de plataforma, sin clínica asignada.');
}

const users = [];
for (let page = 1; ; page += 1) {
  const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  users.push(...data.users);
  if (data.users.length < 100) break;
}

const keepers = users.filter((user) => user.email?.trim().toLowerCase() === keeperEmail);
if (keepers.length !== 1 || keepers[0].id !== profile.id) {
  throw new Error('La cuenta de Auth no coincide de forma única con el perfil que debe conservarse.');
}

const obsoleteUsers = users.filter((user) => user.id !== profile.id);
process.stdout.write(`Se conservará ${keeperEmail}.\n`);
process.stdout.write(`${obsoleteUsers.length} usuarios anteriores ${execute ? 'para eliminar' : '(simulación)'}:\n`);
for (const user of obsoleteUsers) {
  process.stdout.write(`- ${user.email || user.id}\n`);
}

if (execute) {
  for (const user of obsoleteUsers) {
    const { error } = await client.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`No se pudo eliminar ${user.email || user.id}: ${error.message}`);
  }
  const { data: profiles, error } = await client.from('app_profiles').select('id');
  if (error) throw error;
  if (profiles.length !== 1 || profiles[0].id !== profile.id) {
    throw new Error('Se eliminaron usuarios de Auth, pero quedan perfiles adicionales para revisar.');
  }
  process.stdout.write('Quedó únicamente la cuenta de plataforma.\n');
}
