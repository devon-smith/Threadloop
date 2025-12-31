import { methodNotAllowed, withJson } from '../_data';

export default async function handler(req: any, res: any) {
  try {
    const method = typeof req?.method === 'string' ? req.method : (req instanceof Request ? req.method : undefined);
    if (method !== 'GET') return methodNotAllowed(res);

    const env = (typeof process !== 'undefined' ? process.env : undefined) as Record<string, string | undefined> | undefined;
    const domain = env?.AUTH0_DOMAIN;
    const clientId = env?.AUTH0_CLIENT_ID;
    const redirectUri = env?.AUTH0_REDIRECT_URI;
    const connection = env?.AUTH0_CONNECTION;

    if (!domain || !clientId || !redirectUri) {
      return withJson(res, 500, {
        success: false,
        error: 'Missing required Auth0 configuration'
      });
    }

    const authorizeUrl = new URL(`https://${domain}/authorize`);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('scope', 'openid profile email');
    if (connection) {
      authorizeUrl.searchParams.set('connection', connection);
    }

    if (!res || typeof res.writeHead !== 'function' || typeof res.end !== 'function') {
      return new Response(null, {
        status: 302,
        headers: {
          Location: authorizeUrl.toString()
        }
      });
    }

    res.writeHead(302, { Location: authorizeUrl.toString() });
    res.end();
  } catch (e: any) {
    console.error('Auth login error:', e);
    return withJson(res, 500, {
      success: false,
      error: 'Auth login failed'
    });
  }
}
