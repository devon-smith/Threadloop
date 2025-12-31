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
  const updated = {
    ...user,
    ...updates,
    sizingProfile: {
      ...(user as any)?.sizingProfile,
      ...(updates as any)?.sizingProfile
    }
  };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const now = new Date();
    const { error } = await supabase
      .from('users')
      .update({
        style_vibes: (updated as any).styleVibes || [],
        favorite_colors: (updated as any).favoriteColors || [],
        sizing_profile: (updated as any).sizingProfile || {},
        updated_at: now.toISOString()
      })
      .eq('id', (updated as any).id);

    if (error) {
      console.error('Supabase users style update failed:', error);
    }
  }

  const appBaseUrl = env?.APP_BASE_URL || '/';
  const token = createSession(updated, secret);
  setSessionCookie(res, token, appBaseUrl);

  return ok(res, { success: true, data: updated });
}
