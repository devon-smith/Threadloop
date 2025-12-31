import { ok } from './_data';

export default function handler(_req: any, res: any) {
  return ok(res, { status: 'ok', timestamp: new Date().toISOString() });
}
