export const campuses = [
  { id: '22222222-2222-2222-2222-222222222222', name: 'ThreadLoop U' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Cascade College' }
];

export const baseUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'demo@threadloop.app',
  displayName: 'Demo User',
  bio: 'Welcome to ThreadLoop demo.',
  campusId: campuses[0].id,
  styleVibes: ['casual', 'vintage'],
  favoriteColors: ['blue', 'green']
};

export const listings = [
  {
    id: 'l1',
    title: 'Vintage Denim Jacket',
    description: 'Classic blue denim jacket in great condition',
    price: 35,
    category: 'Outerwear',
    size: 'M',
    condition: 'good',
    campusId: campuses[0].id
  },
  {
    id: 'l2',
    title: 'Graphic Tee',
    description: 'Soft cotton tee with retro print',
    price: 12,
    category: 'Tops',
    size: 'L',
    condition: 'like_new',
    campusId: campuses[0].id
  }
];

export function withJson(res, status, body) {
  if (!res || typeof res.setHeader !== 'function' || typeof res.end !== 'function') {
    const ResponseCtor = globalThis?.Response;
    if (!ResponseCtor) {
      throw new Error('Response is not available in this runtime');
    }
    return new ResponseCtor(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

export function ok(res, body) {
  return withJson(res, 200, body);
}

export function badRequest(res, message = 'Bad Request') {
  return withJson(res, 400, { success: false, error: message });
}

export function unauthorized(res, message = 'Unauthorized') {
  return withJson(res, 401, { success: false, error: message });
}

export function methodNotAllowed(res) {
  return withJson(res, 405, { success: false, error: 'Method Not Allowed' });
}
