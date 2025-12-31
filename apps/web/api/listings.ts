import { listings as mockListings, ok, methodNotAllowed, unauthorized, withJson } from './_data.js';
import { getSupabaseAdmin } from './_supabase.js';
import { readSessionCookie } from './_session.js';

function uuid() {
  const c = (globalThis as any)?.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `tl_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
}

export default async function handler(req: any, res: any) {
  const env = (globalThis as any)?.process?.env as Record<string, string | undefined> | undefined;
  const secret = env?.SESSION_SECRET;
  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    return (async () => {
      if (!supabase) {
        return ok(res, { success: true, data: mockListings });
      }

      const sessionUser = secret ? readSessionCookie(req, secret) : null;
      const campusId = sessionUser?.campusId;

      const query = supabase
        .from('listings')
        .select(
          'id,seller_id,campus_id,title,description,category,size,condition,price,swap_value,status,ai_metadata,listing_images(id,listing_id,storage_url)'
        )
        .order('created_at', { ascending: false });

      const result: any = campusId ? await query.eq('campus_id', campusId) : await query;
      if (result?.error) {
        console.error('Supabase listings GET failed:', result.error);
        return ok(res, { success: true, data: mockListings });
      }

      const mapped = (result?.data || []).map((row: any) => ({
        id: row.id,
        sellerId: row.seller_id,
        campusId: row.campus_id,
        title: row.title,
        description: row.description,
        category: row.category,
        size: row.size,
        condition: row.condition,
        price: row.price ?? undefined,
        swapValue: row.swap_value ?? undefined,
        status: row.status,
        aiMetadata: row.ai_metadata ?? undefined,
        images: (row.listing_images || []).map((img: any) => ({
          id: img.id,
          listingId: img.listing_id,
          storageUrl: img.storage_url
        }))
      }));

      return ok(res, { success: true, data: mapped });
    })();
  }

  if (req.method === 'POST') {
    if (!secret) return unauthorized(res, 'Missing SESSION_SECRET');
    const sessionUser = readSessionCookie(req, secret);
    if (!sessionUser) return unauthorized(res, 'Not authenticated');

    const payload = req.body || {};

    if (!supabase) {
      const created = {
        ...payload,
        id: payload.id || uuid(),
        sellerId: sessionUser.id,
        campusId: sessionUser.campusId,
        status: payload.status || 'active'
      };

      mockListings.unshift(created as any);
      return withJson(res, 201, { success: true, data: created });
    }

    const insertRow: any = {
      seller_id: sessionUser.id,
      campus_id: sessionUser.campusId,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      size: payload.size,
      condition: payload.condition,
      price: payload.price ?? null,
      swap_value: payload.swapValue ?? null,
      status: payload.status || 'active',
      ai_metadata: payload.aiMetadata ?? null
    };

    return (async () => {
      const result: any = await supabase
        .from('listings')
        .insert(insertRow)
        .select('id,seller_id,campus_id,title,description,category,size,condition,price,swap_value,status,ai_metadata')
        .single();

      const data = result?.data;
      if (result?.error || !data) {
        console.error('Supabase listings POST failed:', result?.error);
        return withJson(res, 500, { success: false, error: 'Failed to create listing' });
      }

      const images = Array.isArray(payload.images) ? payload.images : [];
      if (images.length > 0) {
        const imageRows = images
          .map((img: any, idx: number) => ({
            listing_id: data.id,
            storage_url: img.storageUrl,
            position: idx
          }))
          .filter((r: any) => typeof r.storage_url === 'string' && r.storage_url);

        if (imageRows.length > 0) {
          const imgInsert = await supabase.from('listing_images').insert(imageRows).select('id,listing_id,storage_url');
          if (imgInsert.error) {
            console.error('Supabase listing_images insert failed:', imgInsert.error);
          }
        }
      }

      const imgRes = await supabase
        .from('listing_images')
        .select('id,listing_id,storage_url')
        .eq('listing_id', data.id)
        .order('position', { ascending: true });

      const listing = {
        id: data.id,
        sellerId: data.seller_id,
        campusId: data.campus_id,
        title: data.title,
        description: data.description,
        category: data.category,
        size: data.size,
        condition: data.condition,
        price: data.price ?? undefined,
        swapValue: data.swap_value ?? undefined,
        status: data.status,
        aiMetadata: data.ai_metadata ?? undefined,
        images: (imgRes.data || []).map((img: any) => ({
          id: img.id,
          listingId: img.listing_id,
          storageUrl: img.storage_url
        }))
      };

      return withJson(res, 201, { success: true, data: listing });
    })();
  }

  return methodNotAllowed(res);
}
