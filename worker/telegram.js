const encoder = new TextEncoder();
const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2,'0')).join('');
export async function hmacKey(token) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return crypto.subtle.importKey('raw', digest, {name:'HMAC',hash:'SHA-256'}, false, ['sign','verify']);
}
export async function verifyTelegram(params, token, now = Date.now()) {
  const entries = [...params.entries()].filter(([k]) => k !== 'state');
  if (new Set(entries.map(([k])=>k)).size !== entries.length) return null;
  const fields = Object.fromEntries(entries);
  const age = now / 1000 - Number(fields.auth_date);
  if (!/^\d+$/.test(fields.id || '') || !/^\d+$/.test(fields.auth_date || '') || age < -30 || age > 300 || !/^[a-f0-9]{64}$/.test(fields.hash || '')) return null;
  const message = entries.filter(([k])=>k!=='hash').sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
  const signature = Uint8Array.from(fields.hash.match(/../g), b=>parseInt(b,16));
  return await crypto.subtle.verify('HMAC', await hmacKey(token), signature, encoder.encode(message)) ? fields.id : null;
}
export async function signReceipt(value, token) {
  const payload = btoa(JSON.stringify(value)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const signature = hex(await crypto.subtle.sign('HMAC', await hmacKey(token), encoder.encode(payload)));
  return payload+'.'+signature;
}
export async function readReceipt(value, token, session, now = Date.now()) {
  try {
    const [payload, signature, extra] = value.split('.');
    if (extra || !/^[a-f0-9]{64}$/.test(signature)) return null;
    const bytes = Uint8Array.from(signature.match(/../g), b=>parseInt(b,16));
    if (!await crypto.subtle.verify('HMAC', await hmacKey(token), bytes, encoder.encode(payload))) return null;
    const data = JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')));
    return data.session === session && data.expires > now && data.provider === 'telegram' ? data : null;
  } catch { return null; }
}
export const isMember = result => ['creator','administrator','member'].includes(result?.status) || (result?.status === 'restricted' && result.is_member === true);
export const accountKey = async id => hex(await crypto.subtle.digest('SHA-256', encoder.encode('telegram:'+id)));
