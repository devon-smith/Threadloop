// Shared mock data for Vercel serverless API

export type Campus = {
  id: string;
  name: string;
};

export type User = {
  id: string;
  email: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  campusId: string;
  styleVibes?: string[];
  favoriteColors?: string[];
  sizingProfile?: {
    topSize?: string;
    bottomSize?: string;
    shoeSize?: string;
    dressSize?: string;
  };
};

export type Listing = {
  id: string;
  title: string;
  description: string;
  price?: number;
  swapValue?: number;
  category: string;
  size: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  campusId: string;
};

export const campuses: Campus[] = [
  { id: '22222222-2222-2222-2222-222222222222', name: 'ThreadLoop U' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Cascade College' }
];

export const baseUser: User = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'demo@threadloop.app',
  displayName: 'Demo User',
  bio: 'Welcome to ThreadLoop demo.',
  campusId: campuses[0].id,
  styleVibes: ['casual', 'vintage'],
  favoriteColors: ['blue', 'green']
};

export const listings: Listing[] = [
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

export function withJson(res: any, status: number, body: any) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).json(body);
}

export function ok(res: any, body: any) {
  withJson(res, 200, body);
}

export function badRequest(res: any, message = 'Bad Request') {
  withJson(res, 400, { success: false, error: message });
}

export function unauthorized(res: any, message = 'Unauthorized') {
  withJson(res, 401, { success: false, error: message });
}

export function methodNotAllowed(res: any) {
  withJson(res, 405, { success: false, error: 'Method Not Allowed' });
}
