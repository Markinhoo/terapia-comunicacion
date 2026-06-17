import { Link } from 'react-router-dom';

function AccessDenied() {
  return (
    <main className="container">
      <section className="access-denied-card">
        <span>Permisos insuficientes</span>
        <h1>No tienes acceso a esta seccion</h1>
        <p>
          Tu usuario puede seguir usando las secciones permitidas desde el menu.
        </p>
        <Link className="btn" to="/admin">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}

export default AccessDenied;
