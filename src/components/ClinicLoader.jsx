import { urlMarca } from '../contexts/clinica';

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

  return <div className={`clinic-loader ${overlay ? 'clinic-loader-overlay' : ''}`} role="status" aria-live="polite">
    <div className="clinic-loader-brand">
      <ClinicBrandMark clinica={clinica || { nombre }} />
      <span className="clinic-loader-orbit" aria-hidden="true" />
    </div>
    <strong>{nombre}</strong>
    <span>{label}</span>
  </div>;
}

export default ClinicLoader;
