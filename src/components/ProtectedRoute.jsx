import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function ProtectedRoute({ children, fallback = null }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        console.error(error);
      }

      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <p className="auth-loading">Verificando sesion...</p>;
  }

  if (!session) {
    return fallback;
  }

  return children;
}

export default ProtectedRoute;
