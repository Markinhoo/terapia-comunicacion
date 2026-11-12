import { useId, useState } from 'react';
import { CLINIC_COLOR_CACHE_PREFIX, CLINIC_LOGO_CACHE_PREFIX, urlMarca } from '../contexts/clinica';
import { COLORES_PREDETERMINADOS, colorValido } from '../utils/clinicBranding';

const recorrido = 'M 23.8 0.5 C 17.5 -1.4 1.4 20.9 9.9 27.3 C 14.2 30.5 21.9 22.9 23.8 17.8 C 28 7 2.1 3.3 0.4 11.6 C -0.4 15.9 10 18.3 12.6 18.7 C 25.2 20.5 31.5 2.9 23.8 0.5 Z';
const recorridoInverso = 'M 0.4 11.6 C 2.1 3.3 28 7 23.8 17.8 C 21.9 22.9 14.2 30.5 9.9 27.3 C 1.4 20.9 17.5 -1.4 23.8 0.5 C 31.5 2.9 25.2 20.5 12.6 18.7 C 10 18.3 -0.4 15.9 0.4 11.6 Z';
const logosLocales = {
  'clinica-evocare': '/loader-evocare.png',
  'clinica-seri': '/loader-seri.jpg'
};
const paletasLocales = {
  'clinica-evocare': { color_primario: '#9a7dcc', color_secundario: '#76599e' },
  'clinica-seri': { color_primario: '#1e8d89', color_secundario: '#819e43' }
};

function obtenerPaletaInicial(slug) {
  const predeterminada = paletasLocales[slug] || COLORES_PREDETERMINADOS;
  try {
    const guardada = JSON.parse(window.localStorage.getItem(`${CLINIC_COLOR_CACHE_PREFIX}${slug}`));
    return {
      color_primario: colorValido(guardada?.color_primario, predeterminada.color_primario),
      color_secundario: colorValido(guardada?.color_secundario, predeterminada.color_secundario)
    };
  } catch {
    return predeterminada;
  }
}

function obtenerLogoInicial(slug) {
  if (!slug) return null;
  if (logosLocales[slug]) return logosLocales[slug];
  try {
    return urlMarca(window.localStorage.getItem(`${CLINIC_LOGO_CACHE_PREFIX}${slug}`));
  } catch {
    return null;
  }
}

export function ClinicBrandMark({ clinica, className = '' }) {
  const nombre = clinica?.nombre || 'Clínica';
  const iniciales = nombre.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
  const logo = urlMarca(clinica?.logo_ruta);

  return <span className={`clinic-brand-mark ${className}`}>
    <span className="clinic-brand-initials" aria-hidden="true">{iniciales}</span>
    {logo && <img src={logo} alt={`Logo de ${nombre}`} onError={(event) => { event.currentTarget.hidden = true; }} />}
  </span>;
}

function ClinicLoader({ clinica, slug, label = 'Cargando clínica...', overlay = false }) {
  const nombre = clinica?.nombre || slug?.replace(/^clinica-/, '').replace(/-/g, ' ') || 'Clínica';
  const texto = label.replace(/\.{3}$/, '');
  const glowId = useId().replace(/:/g, '');
  const [logoInicial] = useState(() => obtenerLogoInicial(slug));
  const [paletaInicial] = useState(() => obtenerPaletaInicial(slug));
  const logo = logoInicial || urlMarca(clinica?.logo_ruta);
  const paleta = {
    '--clinic-loader-primary': colorValido(clinica?.color_primario, paletaInicial.color_primario),
    '--clinic-loader-secondary': colorValido(clinica?.color_secundario, paletaInicial.color_secundario)
  };

  return <div className={`clinic-loader ${overlay ? 'clinic-loader-overlay' : ''}`} style={paleta} role="status" aria-live="polite">
    <div className="clinic-loader-scene" aria-hidden="true">
      <svg className="clinic-loader-particles" viewBox="-5 -5 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.1" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {Array.from({ length: 11 }, (_, index) => <circle
          key={`principal-${index}`}
          r={0.28 + index * 0.038}
          fill={`color-mix(in srgb, var(--clinic-loader-primary) ${100 - index * 10}%, var(--clinic-loader-secondary))`}
          filter={`url(#${glowId})`}
        ><animateMotion path={recorrido} repeatCount="indefinite" begin={`${-index * 0.07}s`} dur="2.8s" /></circle>)}
        {Array.from({ length: 5 }, (_, index) => <circle
          key={`secundario-${index}`}
          r={0.36 + index * 0.05}
          fill="var(--clinic-loader-secondary)"
          filter={`url(#${glowId})`}
        ><animateMotion path={recorridoInverso} repeatCount="indefinite" begin={`${-(index + 2) * 0.07}s`} dur="3.2s" /></circle>)}
      </svg>
      <div className={`clinic-loader-brand${logo ? '' : ' clinic-loader-brand-empty'}`}>
        {logo && <img src={logo} alt={`Logo de ${nombre}`} />}
      </div>
    </div>
    <strong className="clinic-loader-caption">{texto}</strong>
    <span className="clinic-loader-progress" aria-hidden="true" />
  </div>;
}

export default ClinicLoader;
