function ThemeToggle({ theme, onToggle }) {
  const darkMode = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle theme-switch"
      onClick={onToggle}
      role="switch"
      aria-checked={darkMode}
      aria-label={darkMode ? 'Tema oscuro; cambiar a claro' : 'Tema claro; cambiar a oscuro'}
      title={darkMode ? 'Activar tema claro' : 'Activar tema oscuro'}
    >
      <span className="theme-switch-stars" aria-hidden="true" />
      <span className="theme-switch-clouds" aria-hidden="true" />
      <span className="theme-switch-thumb" aria-hidden="true" />
    </button>
  );
}

export default ThemeToggle;
