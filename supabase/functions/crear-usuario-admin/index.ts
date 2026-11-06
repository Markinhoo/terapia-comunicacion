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

    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    const callerId = callerData.user?.id;
    const { data: callerProfile, error: callerProfileError } = callerId
      ? await callerClient.from('app_profiles')
        .select('role, active, clinica_id, plataforma_admin')
        .eq('id', callerId).single()
      : { data: null, error: callerError };

    if (callerError || callerProfileError || !callerProfile?.active ||
        (callerProfile.role !== 'master_admin' && !callerProfile.plataforma_admin)) {
      return new Response(
        JSON.stringify({ error: 'Solo el administrador maestro puede gestionar usuarios.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action = 'create_user', user_id, email, password, role, clinica_id } = await req.json();

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const targetClinicId = callerProfile.plataforma_admin && clinica_id
      ? String(clinica_id)
      : callerProfile.clinica_id;

    if (!targetClinicId) {
      throw new Error('La clínica del usuario no está configurada.');
    }

    const { data: targetClinic, error: clinicError } = await adminClient
      .from('clinicas').select('id').eq('id', targetClinicId).eq('activa', true).single();
    if (clinicError || !targetClinic) throw new Error('Clínica no disponible.');

    const puedeGestionarPerfil = (profile: { clinica_id: string; plataforma_admin: boolean }) =>
      !profile.plataforma_admin && (callerProfile.plataforma_admin ||
        profile.clinica_id === callerProfile.clinica_id);

    if (action === 'delete_user') {
      const targetUserId = String(user_id || '').trim();
      if (!targetUserId) {
        throw new Error('No se indico el usuario.');
      }

      if (callerId === targetUserId) {
        throw new Error('No puedes eliminar tu propia cuenta.');
      }

      const { data: targetProfile, error: profileLookupError } = await adminClient
        .from('app_profiles')
        .select('email, role, clinica_id, plataforma_admin')
        .eq('id', targetUserId)
        .single();

      if (profileLookupError) throw profileLookupError;
      if (!puedeGestionarPerfil(targetProfile)) throw new Error('No puedes modificar usuarios de otra clínica.');

      if (targetProfile.role === 'master_admin') {
        const { count, error: countError } = await adminClient
          .from('app_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'master_admin')
          .eq('clinica_id', targetProfile.clinica_id)
          .eq('active', true);

        if (countError) throw countError;
        if ((count || 0) <= 1) {
          throw new Error('No se puede eliminar al unico administrador maestro.');
        }
      }

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);
      if (deleteError) throw deleteError;

      await adminClient
        .from('invitaciones_usuario')
        .delete()
        .eq('email', targetProfile.email)
        .eq('clinica_id', targetProfile.clinica_id);

      return new Response(
        JSON.stringify({ deleted: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_password') {
      if (!password || String(password).length < 8) {
        throw new Error('La contrasena debe tener al menos 8 caracteres.');
      }

      const targetUserId = String(user_id || '').trim();

      if (!targetUserId) {
        throw new Error('No se indico el usuario.');
      }

      const { data: targetProfile, error: lookupError } = await adminClient
        .from('app_profiles').select('clinica_id, plataforma_admin').eq('id', targetUserId).single();
      if (lookupError || !puedeGestionarPerfil(targetProfile)) {
        throw new Error('No puedes modificar usuarios de otra clínica.');
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

    if (!password || String(password).length < 8) {
      throw new Error('La contrasena debe tener al menos 8 caracteres.');
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
        email_confirm: true,
        app_metadata: { clinica_id: targetClinicId }
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
        clinica_id: targetClinicId,
        active: true,
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      await adminClient.auth.admin.deleteUser(userId);
      throw profileError;
    }

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
