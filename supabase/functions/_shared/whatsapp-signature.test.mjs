import assert from 'node:assert/strict';
import test from 'node:test';
import { validSignature } from './whatsapp-signature.mjs';

test('acepta solo el cuerpo firmado con el secreto de Meta', async () => {
  const body = '{"object":"whatsapp_business_account"}';
  const secret = 'secreto-de-prueba';
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
  const header = `sha256=${Array.from(signature, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
  assert.equal(await validSignature(body, header, secret), true);
  assert.equal(await validSignature(`${body} `, header, secret), false);
  assert.equal(await validSignature(body, header, 'otro-secreto'), false);
  assert.equal(await validSignature(body, 'sha256=incorrecto', secret), false);
  assert.equal(await validSignature(body, null, secret), false);
});
