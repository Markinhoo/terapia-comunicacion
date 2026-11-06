# Plataforma de clínicas

Aplicación React/Vite con Supabase para gestionar agendas, pacientes,
expedientes, pagos y galerías de varias clínicas. Cada clínica usa la misma
estructura, pero sus datos se separan mediante `clinica_id` y políticas RLS.

- Directorio público: `/`
- Sitio de Evocaré: `/clinica-evocare/`
- Acceso del personal: `/clinica-evocare/login`
- Acceso del creador: `/plataforma`

## Desarrollo

Define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el entorno local.
Nunca expongas una service role key en variables `VITE_*` ni en Vercel.

```bash
npm install
npm run dev
npm run lint
npm run build
```

Antes de desplegar esta versión o limpiar datos de prueba, sigue en orden
[supabase/MULTICLINICA.md](supabase/MULTICLINICA.md). Las migraciones y los
borrados no se ejecutan automáticamente al compilar el frontend.
