import { FaMoon, FaSun } from 'react-icons/fa6';

function ThemeToggle({ theme, onToggle }) {
  const darkMode = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={darkMode ? 'Activar tema claro' : 'Activar tema oscuro'}
      title={darkMode ? 'Activar tema claro' : 'Activar tema oscuro'}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {darkMode ? <FaSun /> : <FaMoon />}
      </span>
      <span className="theme-toggle-text">
        {darkMode ? 'Claro' : 'Oscuro'}
      </span>
    </button>
  );
}

export default ThemeToggle;
