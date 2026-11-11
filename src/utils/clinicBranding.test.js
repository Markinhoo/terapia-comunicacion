import assert from 'node:assert/strict';
import test from 'node:test';
import {
  colorTextoSobre,
  colorValido,
  esEnlaceGoogleMaps,
  normalizarMapa,
  urlMapaInsertable,
  urlMapaPorDireccion
} from './clinicBranding.js';

test('solo acepta colores hexadecimales completos', () => {
  assert.equal(colorValido('#aabbcc', '#000000'), '#aabbcc');
  assert.equal(colorValido('red', '#000000'), '#000000');
  assert.equal(colorTextoSobre('#FFFFFF'), '#171717');
  assert.equal(colorTextoSobre('#000000'), '#FFFFFF');
});

test('solo inserta URLs del mapa de Google', () => {
  assert.equal(
    urlMapaInsertable('https://www.google.com/maps/embed?pb=abc'),
    'https://www.google.com/maps/embed?pb=abc'
  );
  assert.equal(urlMapaInsertable('https://maps.app.goo.gl/abc'), '');
  assert.equal(urlMapaInsertable('https://www.google.com.ejemplo.com/maps/embed?pb=abc'), '');
  assert.equal(urlMapaInsertable('javascript:alert(1)'), '');
});

test('un enlace corto de Maps sirve para abrirlo, no para insertarlo', () => {
  assert.equal(esEnlaceGoogleMaps('https://maps.app.goo.gl/F84X2EnMReq2ntiS8'), true);
  assert.equal(esEnlaceGoogleMaps('https://www.google.com/maps/place/Durango'), true);
  assert.equal(esEnlaceGoogleMaps('https://maps.app.goo.gl.ejemplo.com/abc'), false);
  assert.equal(esEnlaceGoogleMaps('javascript:alert(1)'), false);
});

test('un solo enlace corto no bloquea el alta de clínica', () => {
  const enlace = 'https://maps.app.goo.gl/F84X2EnMReq2ntiS8';
  assert.deepEqual(normalizarMapa(enlace), { mapa_url: enlace, mapa_embed_url: null });
  assert.deepEqual(normalizarMapa(''), { mapa_url: null, mapa_embed_url: null });
  assert.ok(normalizarMapa('https://ejemplo.com/mapa').error);
});

test('conserva un mapa previo solo mientras no cambie el enlace', () => {
  const anterior = {
    mapa_url: 'https://maps.app.goo.gl/anterior',
    mapa_embed_url: 'https://www.google.com/maps/embed?pb=abc'
  };
  assert.equal(normalizarMapa(anterior.mapa_url, anterior).mapa_embed_url, anterior.mapa_embed_url);
  assert.equal(normalizarMapa('https://maps.app.goo.gl/nuevo', anterior).mapa_embed_url, null);
});

test('la dirección permite una vista de búsqueda', () => {
  assert.equal(
    urlMapaPorDireccion('  Durango, México  '),
    'https://maps.google.com/maps?q=Durango%2C%20M%C3%A9xico&output=embed'
  );
  assert.equal(urlMapaPorDireccion(''), '');
});
