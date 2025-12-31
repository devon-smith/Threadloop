import { badRequest, campuses } from '../_data.js';
import { createSession, setSessionCookie } from '../_session.js';

export default async function handler(req: any, res: any) {
  const { code } = req.query || {};
  if (!code) {
    return badRequest(res, 'Missing authorization code');
  }

  const env = (globalThis as any)?.process?.env as Record<string, string | undefined> | undefined;
  const domain = env?.AUTH0_DOMAIN;
  const clientId = env?.AUTH0_CLIENT_ID;
  const clientSecret = env?.AUTH0_CLIENT_SECRET;
  const redirectUri = env?.AUTH0_REDIRECT_URI;
  const appBaseUrl = env?.APP_BASE_URL || '/';
  const sessionSecret = env?.SESSION_SECRET;
  const allowedDomains = (env?.ALLOWED_EMAIL_DOMAINS || 'stanford.edu')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  if (!domain || !clientId || !clientSecret || !redirectUri || !sessionSecret) {
    res.writeHead(302, { Location: `${appBaseUrl}?auth_error=missing_config` });
    return res.end();
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(`https://${domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      console.error('Auth0 token exchange failed:', t);
      res.writeHead(302, { Location: `${appBaseUrl}?auth_error=token` });
      return res.end();
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token as string;

    // Fetch userinfo
    const userRes = await fetch(`https://${domain}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!userRes.ok) {
      const t = await userRes.text();
      console.error('Auth0 userinfo failed:', t);
      res.writeHead(302, { Location: `${appBaseUrl}?auth_error=userinfo` });
      return res.end();
    }

    const user = await userRes.json();

    const email = typeof user?.email === 'string' ? user.email : '';
    const emailDomain = email.split('@')[1]?.toLowerCase() || '';
    if (!email || !emailDomain || !allowedDomains.includes(emailDomain)) {
      res.writeHead(302, { Location: `${appBaseUrl}?auth_error=domain` });
      return res.end();
    }

    const campusId = campuses[0]?.id || '22222222-2222-2222-2222-222222222222';
    const displayName =
      (typeof user?.name === 'string' && user.name) ||
      (typeof user?.nickname === 'string' && user.nickname) ||
      email.split('@')[0] ||
      'Student';

    const authProvider = typeof user?.sub === 'string' && user.sub.startsWith('google-oauth2|') ? 'google' : 'email';
    const emailVerified = Boolean(user?.email_verified);
    const profile = {
      id: (typeof user?.sub === 'string' && user.sub) || email,
      email,
      emailVerified,
      campusId,
      displayName,
      avatarUrl: typeof user?.picture === 'string' ? user.picture : undefined,
      bio: undefined,
      authProvider,
      lastLogin: new Date(),
      createdAt: new Date(),
      rating: 0,
      totalRatings: 0,
      swapCount: 0,
      successfulSwaps: 0,
      badges: emailVerified ? ['verified-student'] : [],
      swapStreak: 0,
      averageResponseTime: 0,
      responseRate: 0,
      styleVibes: [],
      favoriteColors: [],
      sizingProfile: {},
      settings: {
        showProfile: true,
        allowMessages: true,
        shareStylePreferences: true,
        emailNotifications: true,
        pushNotifications: false
      }
    };

    // Create session and set cookie
    const token = createSession(profile, sessionSecret);
    setSessionCookie(res, token, appBaseUrl);

    res.writeHead(302, { Location: `${appBaseUrl.replace(/\/$/, '')}/profile` });
    res.end();
  } catch (e) {
    console.error('Auth callback error:', e);
    res.writeHead(302, { Location: `${appBaseUrl}?auth_error=exception` });
    res.end();
  }
}
