import crypto from 'crypto';

const COOKIE_NAME = 'threadloop_session';

function b64url(input: string) {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function createSession(user: any, secret: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: user.sub || user.id || user.email, iat: now, user };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = crypto
    .createHmac('sha256', secret)
    .update(unsigned)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${unsigned}.${sig}`;
}

export function verifySession(token: string, secret: string) {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${h}.${p}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    if (expected !== s) return null;
    const payload = JSON.parse(Buffer.from(p, 'base64').toString('utf8'));
    return payload?.user || null;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: any, token: string, appBaseUrl: string) {
  const cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure;`;
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res: any) {
  const cookie = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0;`;
  res.setHeader('Set-Cookie', cookie);
}

export function readSessionCookie(req: any, secret: string) {
  const header = req.headers['cookie'] || '';
  const cookies = Object.fromEntries(
    header
      .split(';')
      .map((c: string) => c.trim())
      .filter(Boolean)
      .map((c: string) => {
        const idx = c.indexOf('=');
        return [c.slice(0, idx), decodeURIComponent(c.slice(idx + 1))];
      })
  );
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySession(token, secret);
}
