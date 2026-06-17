import { useEffect, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const mostrarToast = (mensaje, tipo = 'info') => {
    setToast({ mensaje, tipo, id: Date.now() });
  };

  useEffect(() => {
    if (!toast) return undefined;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 3600);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  return {
    toast,
    mostrarToast,
    cerrarToast: () => setToast(null)
  };
}
