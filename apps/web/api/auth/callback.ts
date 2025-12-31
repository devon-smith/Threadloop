import { ok, badRequest } from '../_data.js';
import { createSession, setSessionCookie } from '../_session.js';

export default async function handler(req: any, res: any) {
  const { code } = req.query || {};
  if (!code) {
    return badRequest(res, 'Missing authorization code');
  }

  const domain = process.env.AUTH0_DOMAIN!;
  const clientId = process.env.AUTH0_CLIENT_ID!;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET!;
  const redirectUri = process.env.AUTH0_REDIRECT_URI!;
  const appBaseUrl = process.env.APP_BASE_URL || '/';
  const sessionSecret = process.env.SESSION_SECRET!;

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

    // Create session and set cookie
    const token = createSession(user, sessionSecret);
    setSessionCookie(res, token, appBaseUrl);

    res.writeHead(302, { Location: appBaseUrl });
    res.end();
  } catch (e) {
    console.error('Auth callback error:', e);
    res.writeHead(302, { Location: `${appBaseUrl}?auth_error=exception` });
    res.end();
  }
}
