import { badRequest, methodNotAllowed, ok } from '../_data.js';

function readBody(req: any) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const body = readBody(req);
  const hasImageData = typeof body.imageData === 'string' && body.imageData.length > 0;
  const hasImageUrl = typeof body.imageUrl === 'string' && body.imageUrl.length > 0;

  if (!hasImageData && !hasImageUrl) {
    return badRequest(res, 'Provide imageData or imageUrl');
  }

  return ok(res, {
    success: true,
    data: {
      title: 'Campus-ready staple',
      description: 'Great condition and perfect for campus swaps. Meet up in a public spot on campus to exchange.',
      category: body.category || 'Tops',
      size: body.size || 'M',
      condition: 'like_new',
      price: 25,
      aiMetadata: {
        provider: 'stub',
        source: hasImageUrl ? 'imageUrl' : 'imageData'
      }
    }
  });
}
