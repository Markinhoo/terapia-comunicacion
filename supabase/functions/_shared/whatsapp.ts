import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function createAdminClient() {
  const url = Deno.env.get('PROJECT_URL') || Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Falta configurar Supabase en la función.');
  return createClient(url, key, { auth: { persistSession: false } });
}

export function createCallerClient(authorization: string) {
  const url = Deno.env.get('PROJECT_URL') || Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Falta configurar Supabase en la función.');
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } }
  });
}
