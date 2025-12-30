import { baseUser, ok, unauthorized, methodNotAllowed } from '../_data';
import { readSessionCookie } from '../_session';

export default function handler(req: any, res: any) {
  if (req.method !== 'PUT') return methodNotAllowed(res);

  const secret = process.env.SESSION_SECRET!;
  const user = readSessionCookie(req, secret);
  if (!user) return unauthorized(res, 'Not authenticated');

  const updates = req.body || {};
  const updated = { ...baseUser, ...user, ...updates };

  return ok(res, { success: true, data: updated });
}
