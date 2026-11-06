import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const execute = process.argv.includes('--delete');

if (!url || !key) {
  throw new Error('Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.');
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { data: clinicas, error: clinicError } = await client
  .from('clinicas').select('slug');
if (clinicError) throw clinicError;
if (clinicas.length !== 1 || clinicas[0].slug !== 'clinica-evocare') {
  throw new Error('La limpieza solo se permite cuando Evocaré es la única clínica.');
}

for (const table of [
  'pacientes', 'citas', 'paciente_detalle', 'expedientes',
  'paciente_objetivos', 'objetivos_terapeuticos', 'archivos_paciente',
  'sesiones_paciente', 'envios_reglamento', 'galeria_terapias', 'galeria_likes'
]) {
  const { count, error } = await client.from(table)
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  if (count !== 0) {
    throw new Error(`La tabla ${table} aún contiene registros; ejecuta primero la limpieza SQL.`);
  }
}

async function listFiles(bucket, prefix = '') {
  const paths = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client.storage.from(bucket)
      .list(prefix, { limit: 100, offset });
    if (error) throw error;
    for (const item of data || []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) paths.push(path);
      else paths.push(...await listFiles(bucket, path));
    }
    if (!data || data.length < 100) break;
    offset += 100;
  }

  return paths;
}

for (const bucket of ['expedientes', 'galeria-terapias']) {
  const paths = await listFiles(bucket);
  process.stdout.write(`${bucket}: ${paths.length} archivos${execute ? ' para eliminar' : ' (simulación)'}\n`);
  if (!execute) continue;

  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await client.storage.from(bucket).remove(paths.slice(index, index + 100));
    if (error) throw error;
  }
}
