import { listings, ok, methodNotAllowed } from './_data';

export default function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return ok(res, { success: true, data: listings });
  }

  return methodNotAllowed(res);
}
