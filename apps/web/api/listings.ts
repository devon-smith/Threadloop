import { listings, ok, methodNotAllowed, withJson } from './_data';

function uuid() {
  const c = (globalThis as any)?.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `tl_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
}

export default function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return ok(res, { success: true, data: listings });
  }

  if (req.method === 'POST') {
    const payload = req.body || {};
    const created = {
      ...payload,
      id: payload.id || uuid()
    };

    listings.unshift(created as any);
    return withJson(res, 201, { success: true, data: created });
  }

  return methodNotAllowed(res);
}
