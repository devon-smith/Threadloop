import { listings, ok, methodNotAllowed, withJson } from './_data';
import { randomUUID } from 'crypto';

export default function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return ok(res, { success: true, data: listings });
  }

  if (req.method === 'POST') {
    const payload = req.body || {};
    const created = {
      ...payload,
      id: payload.id || randomUUID()
    };

    listings.unshift(created as any);
    return withJson(res, 201, { success: true, data: created });
  }

  return methodNotAllowed(res);
}
