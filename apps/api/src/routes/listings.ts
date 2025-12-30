import { Router } from 'express';
import { z } from 'zod';
import { createListing, getListings, ListingInput } from '../data/inMemory';

const router = Router();
const dataUrlRegex = /^data:image\/[a-zA-Z]+;base64,/;

const storageUrlSchema = z
  .string()
  .refine(
    (value) => value.startsWith('http://') || value.startsWith('https://') || dataUrlRegex.test(value),
    { message: 'storageUrl must be http(s) or data URI' }
  );

const listingSchema = z.object({
  sellerId: z.string().uuid(),
  campusId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string(),
  size: z.string(),
  condition: z.enum(['new', 'like_new', 'good', 'fair']),
  price: z.number().optional(),
  swapValue: z.number().optional(),
  status: z.enum(['active', 'reserved', 'completed', 'cancelled']).default('active'),
  aiMetadata: z.record(z.unknown()).optional(),
  images: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        listingId: z.string().uuid().optional(),
        storageUrl: storageUrlSchema,
        qualityScore: z.number().optional()
      })
    )
    .nonempty()
});

router.get('/', (_req, res) => {
  const listings = getListings();
  res.json({ success: true, data: listings });
});

router.post('/', (req, res) => {
  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  const listingInput: ListingInput = {
    ...parsed.data,
    images: parsed.data.images.map((image) => ({
      storageUrl: image.storageUrl,
      qualityScore: image.qualityScore
    }))
  };
  const listing = createListing(listingInput);
  return res.status(201).json({ success: true, data: listing });
});

export default router;
