import { createContext, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

export const ClinicaContext = createContext(null);

export function useClinica() {
  const clinica = useContext(ClinicaContext);
  if (!clinica) throw new Error('Esta página requiere una clínica.');
  return clinica;
}

export function urlMarca(ruta) {
  if (!ruta) return null;
  return supabase.storage.from('clinica-branding').getPublicUrl(ruta).data.publicUrl;
}
