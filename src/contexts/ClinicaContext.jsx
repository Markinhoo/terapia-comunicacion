import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CLINIC_COLOR_CACHE_PREFIX, CLINIC_LOGO_CACHE_PREFIX, ClinicaContext, urlMarca } from './clinica';
import { COLORES_PREDETERMINADOS, colorTextoSobre, colorValido } from '../utils/clinicBranding';
import ClinicLoader from '../components/ClinicLoader';

export function ClinicaProvider({ slug, paginaPreparada, children }) {
  const [clinica, setClinica] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paginaInicial, setPaginaInicial] = useState(null);

  useEffect(() => {
    let active = true;

    supabase.from('clinicas').select('*').eq('slug', slug).eq('activa', true)
      .maybeSingle().then(async ({ data, error: queryError }) => {
        if (!active) return;
        setClinica(data);
        setError(queryError ? 'No se pudo cargar la clínica.' : '');
        if (data) {
          try {
            window.localStorage.setItem(`${CLINIC_COLOR_CACHE_PREFIX}${slug}`, JSON.stringify({
              color_primario: colorValido(data.color_primario, COLORES_PREDETERMINADOS.color_primario),
              color_secundario: colorValido(data.color_secundario, COLORES_PREDETERMINADOS.color_secundario)
            }));
          } catch { /* El almacenamiento puede estar deshabilitado. */ }
        }
        const imagenPreparada = data?.logo_ruta ? new Promise((resolve) => {
          try { window.localStorage.setItem(`${CLINIC_LOGO_CACHE_PREFIX}${slug}`, data.logo_ruta); } catch { /* El almacenamiento puede estar deshabilitado. */ }
          const image = new Image();
          const timeout = window.setTimeout(resolve, 1200);
          image.onload = image.onerror = () => { window.clearTimeout(timeout); resolve(); };
          image.src = urlMarca(data.logo_ruta);
        }) : Promise.resolve();
        const [, pagina] = await Promise.allSettled([imagenPreparada, paginaPreparada]);
        if (!active) return;
        if (pagina.status === 'fulfilled') setPaginaInicial(pagina.value);
        setLoading(false);
      });

    return () => { active = false; };
  }, [slug, paginaPreparada]);

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

  if (loading) return <ClinicLoader clinica={clinica} slug={slug} label="Preparando la página..." />;
  if (!clinica) return <p className="auth-loading">{error || 'Clínica no encontrada.'}</p>;

  return <ClinicaContext.Provider value={{ ...clinica, refrescar }}>
    {typeof children === 'function' ? children(paginaInicial) : children}
  </ClinicaContext.Provider>;
}

