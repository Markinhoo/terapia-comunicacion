import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ClinicaContext, urlMarca } from './clinica';
import { COLORES_PREDETERMINADOS, colorTextoSobre, colorValido } from '../utils/clinicBranding';
import ClinicLoader from '../components/ClinicLoader';

export function ClinicaProvider({ slug, children }) {
  const [clinica, setClinica] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    supabase.from('clinicas').select('*').eq('slug', slug).eq('activa', true)
      .maybeSingle().then(async ({ data, error: queryError }) => {
        if (!active) return;
        setClinica(data);
        setError(queryError ? 'No se pudo cargar la clínica.' : '');
        if (data?.logo_ruta) {
          await new Promise((resolve) => {
            const image = new Image();
            const timeout = window.setTimeout(resolve, 1200);
            image.onload = image.onerror = () => { window.clearTimeout(timeout); resolve(); };
            image.src = urlMarca(data.logo_ruta);
          });
        }
        if (!active) return;
        setLoading(false);
      });

    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (clinica?.nombre) document.title = clinica.nombre;
  }, [clinica]);

  useEffect(() => {
    if (!clinica) return undefined;
    const primario = colorValido(clinica.color_primario, COLORES_PREDETERMINADOS.color_primario);
    const secundario = colorValido(clinica.color_secundario, COLORES_PREDETERMINADOS.color_secundario);
    const boton = colorValido(clinica.color_boton, COLORES_PREDETERMINADOS.color_boton);
    const root = document.documentElement;
    const variables = {
      '--primary': primario,
      '--primary-strong': 'color-mix(in srgb, var(--primary) 35%, var(--palette-ink))',
      '--secondary': secundario,
      '--button-bg': boton,
      '--button-text': colorTextoSobre(boton),
      '--nav-bg': `color-mix(in srgb, ${primario} 30%, #111111)`
    };
    root.dataset.site = 'clinic';
    Object.entries(variables).forEach(([nombre, valor]) => root.style.setProperty(nombre, valor));
    return () => {
      Object.keys(variables).forEach((nombre) => root.style.removeProperty(nombre));
      delete root.dataset.site;
    };
  }, [clinica]);

  const refrescar = async () => {
    const { data, error: queryError } = await supabase.from('clinicas')
      .select('*').eq('slug', slug).eq('activa', true).single();
    if (queryError) throw queryError;
    setClinica(data);
  };

  if (loading) return <ClinicLoader clinica={clinica} slug={slug} />;
  if (!clinica) return <p className="auth-loading">{error || 'Clínica no encontrada.'}</p>;

  return <ClinicaContext.Provider value={{ ...clinica, refrescar }}>{children}</ClinicaContext.Provider>;
}

