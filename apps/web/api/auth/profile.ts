import { ok, unauthorized, methodNotAllowed } from '../_data.js';
import { createSession, readSessionCookie, setSessionCookie } from '../_session.js';
import { getSupabaseAdmin } from '../_supabase.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'PUT') return methodNotAllowed(res);

  const env = (globalThis as any)?.process?.env as Record<string, string | undefined> | undefined;
  const secret = env?.SESSION_SECRET;
  if (!secret) return unauthorized(res, 'Missing SESSION_SECRET');
  const user = readSessionCookie(req, secret);
  if (!user) return unauthorized(res, 'Not authenticated');

  const updates = req.body || {};
  const updated = { ...user, ...updates };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const now = new Date();
    const { error } = await supabase
      .from('users')
      .update({
        display_name: updated.displayName,
        avatar_url: updated.avatarUrl ?? null,
        bio: updated.bio ?? null,
        updated_at: now.toISOString()
      })
      .eq('id', updated.id);

    if (error) {
      console.error('Supabase users update failed:', error);
    }
  }

  const appBaseUrl = env?.APP_BASE_URL || '/';
  const token = createSession(updated, secret);
  setSessionCookie(res, token, appBaseUrl);

  return ok(res, { success: true, data: updated });
}
