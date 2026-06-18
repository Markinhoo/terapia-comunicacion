import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('PROJECT_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('ANON_KEY') ?? '';
    const authorization = req.headers.get('Authorization') ?? '';

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } }
    });

    const { data: canManage, error: permissionError } =
      await callerClient.rpc('can_manage_users');

    if (permissionError || !canManage) {
      return new Response(
        JSON.stringify({ error: 'Solo el administrador maestro puede gestionar usuarios.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action = 'create_user', user_id, email, password, role } = await req.json();

    if (!password || String(password).length < 8) {
      throw new Error('La contrasena debe tener al menos 8 caracteres.');
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (action === 'update_password') {
      const targetUserId = String(user_id || '').trim();

      if (!targetUserId) {
        throw new Error('No se indico el usuario.');
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        targetUserId,
        { password: String(password) }
      );

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ updated: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action !== 'create_user') {
      throw new Error('La accion solicitada no es valida.');
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedRole = String(role || 'user');

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      throw new Error('El correo no es valido.');
    }

    if (!['master_admin', 'admin', 'user'].includes(normalizedRole)) {
      throw new Error('El rol no es valido.');
    }

    const { data: userData, error: createError } =
      await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true
      });

    if (createError) throw createError;

    const userId = userData.user?.id;

    if (!userId) {
      throw new Error('No se pudo obtener el usuario creado.');
    }

    const { error: profileError } = await adminClient
      .from('app_profiles')
      .upsert({
        id: userId,
        email: normalizedEmail,
        role: normalizedRole,
        active: true,
        updated_at: new Date().toISOString()
      });

    if (profileError) throw profileError;

    await adminClient
      .from('invitaciones_usuario')
      .insert({
        email: normalizedEmail,
        role: normalizedRole,
        estado: 'aceptada'
      });

    return new Response(
      JSON.stringify({ user_id: userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'No se pudo crear el usuario.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
