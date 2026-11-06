import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ClinicaContext } from './clinica';

export function ClinicaProvider({ slug, children }) {
  const [clinica, setClinica] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    supabase.from('clinicas').select('*').eq('slug', slug).eq('activa', true)
      .maybeSingle().then(({ data, error: queryError }) => {
        if (!active) return;
        setClinica(data);
        setError(queryError ? 'No se pudo cargar la clínica.' : '');
        setLoading(false);
      });

    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (clinica?.nombre) document.title = clinica.nombre;
  }, [clinica]);

  if (loading) return <p className="auth-loading">Cargando clínica...</p>;
  if (!clinica) return <p className="auth-loading">{error || 'Clínica no encontrada.'}</p>;

  return <ClinicaContext.Provider value={clinica}>{children}</ClinicaContext.Provider>;
}

