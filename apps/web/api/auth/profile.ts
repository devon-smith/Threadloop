import { ok, unauthorized, methodNotAllowed } from '../_data.js';
import { createSession, readSessionCookie, setSessionCookie } from '../_session.js';

export default function handler(req: any, res: any) {
  if (req.method !== 'PUT') return methodNotAllowed(res);

  const env = (globalThis as any)?.process?.env as Record<string, string | undefined> | undefined;
  const secret = env?.SESSION_SECRET;
  if (!secret) return unauthorized(res, 'Missing SESSION_SECRET');
  const user = readSessionCookie(req, secret);
  if (!user) return unauthorized(res, 'Not authenticated');

  const updates = req.body || {};
  const updated = { ...user, ...updates };

  const appBaseUrl = env?.APP_BASE_URL || '/';
  const token = createSession(updated, secret);
  setSessionCookie(res, token, appBaseUrl);

  return ok(res, { success: true, data: updated });
}
