import { ok, methodNotAllowed } from '../_data';
import { clearSessionCookie } from '../_session';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const domain = process.env.AUTH0_DOMAIN!;
  const clientId = process.env.AUTH0_CLIENT_ID!;
  const returnTo = process.env.AUTH0_LOGOUT_REDIRECT || process.env.APP_BASE_URL || '/';

  clearSessionCookie(res);

  const logoutUrl = new URL(`https://${domain}/v2/logout`);
  logoutUrl.searchParams.set('client_id', clientId);
  logoutUrl.searchParams.set('returnTo', returnTo);

  res.writeHead(302, { Location: logoutUrl.toString() });
  res.end();
}
