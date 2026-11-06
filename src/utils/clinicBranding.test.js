import assert from 'node:assert/strict';
import test from 'node:test';
import {
  colorTextoSobre,
  colorValido,
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

test('la dirección permite una vista de búsqueda', () => {
  assert.equal(
    urlMapaPorDireccion('  Durango, México  '),
    'https://maps.google.com/maps?q=Durango%2C%20M%C3%A9xico&output=embed'
  );
  assert.equal(urlMapaPorDireccion(''), '');
});
