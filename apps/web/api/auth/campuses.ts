import { campuses, ok, methodNotAllowed } from '../../api/_data';

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') return methodNotAllowed(res);
  return ok(res, { success: true, data: campuses });
}
