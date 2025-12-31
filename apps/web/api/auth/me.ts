import { ok, unauthorized, methodNotAllowed } from '../_data';
import { readSessionCookie } from '../_session';

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') return methodNotAllowed(res);

  const env = (globalThis as any)?.process?.env as Record<string, string | undefined> | undefined;
  const secret = env?.SESSION_SECRET;
  if (!secret) return unauthorized(res, 'Missing SESSION_SECRET');
  const user = readSessionCookie(req, secret);
  if (!user) return unauthorized(res, 'Not authenticated');

  return ok(res, { success: true, data: user });
}
