export const COLORES_PREDETERMINADOS = {
  color_primario: '#6B4F9B',
  color_secundario: '#9A7DCC',
  color_boton: '#6B4F9B'
};

export function colorValido(valor, respaldo) {
  return /^#[0-9a-f]{6}$/i.test(valor || '') ? valor : respaldo;
}

export function colorTextoSobre(hex) {
  const canales = [1, 3, 5].map((inicio) => {
    const valor = parseInt(hex.slice(inicio, inicio + 2), 16) / 255;
    return valor <= 0.04045 ? valor / 12.92 : ((valor + 0.055) / 1.055) ** 2.4;
  });
  const luminancia = canales[0] * 0.2126 + canales[1] * 0.7152 + canales[2] * 0.0722;
  return luminancia > 0.179 ? '#171717' : '#FFFFFF';
}

export function urlMapaInsertable(valor) {
  if (!valor) return '';
  const entrada = valor.trim();
  const urlTexto = entrada.startsWith('<')
    ? new DOMParser().parseFromString(entrada, 'text/html').querySelector('iframe')?.getAttribute('src')
    : entrada;
  if (!urlTexto) return '';

  try {
    const url = new URL(urlTexto);
    return url.protocol === 'https:' && url.hostname === 'www.google.com' && url.pathname === '/maps/embed'
      ? url.toString()
      : '';
  } catch {
    return '';
  }
}

export function esEnlaceGoogleMaps(valor) {
  try {
    const url = new URL(valor.trim());
    return url.protocol === 'https:' && (
      url.hostname === 'maps.app.goo.gl' ||
      (['google.com', 'www.google.com', 'maps.google.com'].includes(url.hostname)
        && url.pathname.startsWith('/maps'))
    );
  } catch {
    return false;
  }
}

export function normalizarMapa(enlace, anterior = {}) {
  const mapaUrl = enlace.trim();
  if (mapaUrl && !esEnlaceGoogleMaps(mapaUrl)) {
    return { error: 'Pega un enlace válido de Google Maps que comience con https://.' };
  }
  const embed = urlMapaInsertable(mapaUrl)
    || (mapaUrl === (anterior.mapa_url || '') ? urlMapaInsertable(anterior.mapa_embed_url) : '');
  return { mapa_url: mapaUrl || null, mapa_embed_url: embed || null };
}

export function urlMapaPorDireccion(direccion) {
  return direccion?.trim()
    ? `https://maps.google.com/maps?q=${encodeURIComponent(direccion.trim())}&output=embed`
    : '';
}
