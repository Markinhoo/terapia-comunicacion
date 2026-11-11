export async function validSignature(body, header, secret) {
  if (!header || !/^sha256=[a-f0-9]{64}$/i.test(header)) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const bytes = header.slice(7).match(/.{2}/g) || [];
  const signature = Uint8Array.from(bytes, (part) => parseInt(part, 16));
  return crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(body));
}
