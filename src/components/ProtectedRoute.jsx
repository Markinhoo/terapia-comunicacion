import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useClinica } from '../contexts/clinica';
import ClinicLoader from './ClinicLoader';

function ProtectedRoute({ children, fallback = null, expectedClinicId }) {
  const clinica = useClinica();
  const [session, setSession] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const checkSequence = useRef(0);

  useEffect(() => {
    let active = true;

    const checkSession = async (nextSession) => {
      const checkId = ++checkSequence.current;
      if (!nextSession) {
        if (active) { setSession(null); setAuthorized(false); setRole(null); setLoading(false); }
        return;
      }

      const { data: profile } = await supabase.from('app_profiles')
        .select('clinica_id, active, role').eq('id', nextSession.user.id).maybeSingle();
      if (active && checkId === checkSequence.current) {
        setSession(nextSession);
        setAuthorized(profile?.active === true && profile.clinica_id === expectedClinicId);
        setRole(profile?.role || null);
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        console.error(error);
      }

      checkSession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => checkSession(nextSession), 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [expectedClinicId]);

  if (loading) {
    return <ClinicLoader clinica={clinica} label="Verificando acceso..." />;
  }

  if (!session || !authorized) {
    return fallback;
  }

  return typeof children === 'function' ? children(role) : children;
}

export default ProtectedRoute;
