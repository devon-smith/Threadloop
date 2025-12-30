import { methodNotAllowed } from '../_data';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return methodNotAllowed(res);

  const domain = process.env.AUTH0_DOMAIN!;
  const clientId = process.env.AUTH0_CLIENT_ID!;
  const redirectUri = process.env.AUTH0_REDIRECT_URI!;

  const authorizeUrl = new URL(`https://${domain}/authorize`);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', 'openid profile email');
  // If you want to force Stanford SAML connection only, uncomment and set your connection name
  // authorizeUrl.searchParams.set('connection', 'samlp');

  res.writeHead(302, { Location: authorizeUrl.toString() });
  res.end();
}
