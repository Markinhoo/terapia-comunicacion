function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className={`toast-clinica ${toast.tipo || 'info'}`} role="status">
      <span className="toast-icon" aria-hidden="true">
        {toast.tipo === 'error' ? '×' : '✓'}
      </span>
      <p>{toast.mensaje}</p>
      <button type="button" onClick={onClose} aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  );
}

export default Toast;
