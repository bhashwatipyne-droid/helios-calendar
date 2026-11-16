/**
 * Stores ONLY the finished calendar PNG (one per distributor, latest wins).
 * Users' original photos never reach this Worker — the browser composes the calendar locally.
 *
 *   PUT /calendar/:year   Authorization: Bearer <token from /api/upload-token>   body: image/png
 */
interface Env {
  CALENDARS: R2Bucket;
  UPLOAD_SECRET: string;
  ALLOWED_ORIGIN: string;
}

const MAX_BYTES = 25 * 1024 * 1024;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const ID_RE = /^(ARN-\d{3,7}|[6-9]\d{9})$/;

const enc = new TextEncoder();

function b64urlToBytes(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

/** Token = base64url(JSON {id, exp}) + "." + base64url(HMAC-SHA256). Returns the id or null. */
async function verifyToken(token: string, secret: string): Promise<string | null> {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  let ok = false;
  try {
    ok = await crypto.subtle.verify('HMAC', key, b64urlToBytes(sig), enc.encode(body));
  } catch {
    return null;
  }
  if (!ok) return null;
  try {
    const { id, exp } = JSON.parse(new TextDecoder().decode(b64urlToBytes(body))) as { id?: string; exp?: number };
    if (!id || !exp || exp < Date.now() / 1000 || !ID_RE.test(id)) return null;
    return id;
  } catch {
    return null;
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      Vary: 'Origin',
    };
    const reply = (body: string, status: number) => new Response(body, { status, headers: cors });

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const m = new URL(req.url).pathname.match(/^\/calendar\/(\d{4})$/);
    if (!m || req.method !== 'PUT') return reply('Not found', 404);

    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const id = await verifyToken(token, env.UPLOAD_SECRET);
    if (!id) return reply('Unauthorized', 401);

    if (req.headers.get('Content-Type') !== 'image/png') return reply('PNG only', 415);
    const declared = Number(req.headers.get('Content-Length') ?? 0);
    if (declared > MAX_BYTES) return reply('Too large', 413);

    const data = await req.arrayBuffer();
    if (data.byteLength === 0 || data.byteLength > MAX_BYTES) return reply('Bad size', 413);
    const head = new Uint8Array(data, 0, 8);
    if (!PNG_MAGIC.every((b, i) => head[i] === b)) return reply('Not a PNG', 415);

    await env.CALENDARS.put(`calendars/${m[1]}/${id}.png`, data, {
      httpMetadata: { contentType: 'image/png' },
      customMetadata: { uploadedAt: new Date().toISOString() },
    });
    return reply('ok', 200);
  },
};
