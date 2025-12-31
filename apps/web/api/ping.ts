import { ok } from './_data.js';

export default function handler(_req: any, res: any) {
  const body = { status: 'ok', timestamp: new Date().toISOString() };

  if (!res) {
    return ok(undefined, body);
  }

  return ok(res, body);
}
