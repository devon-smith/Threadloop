"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const inMemory_1 = require("../data/inMemory");
const router = (0, express_1.Router)();
const dataUrlRegex = /^data:image\/[a-zA-Z]+;base64,/;
const storageUrlSchema = zod_1.z
    .string()
    .refine((value) => value.startsWith('http://') || value.startsWith('https://') || dataUrlRegex.test(value), { message: 'storageUrl must be http(s) or data URI' });
const listingSchema = zod_1.z.object({
    sellerId: zod_1.z.string().uuid(),
    campusId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().min(10),
    category: zod_1.z.string(),
    size: zod_1.z.string(),
    condition: zod_1.z.enum(['new', 'like_new', 'good', 'fair']),
    price: zod_1.z.number().optional(),
    swapValue: zod_1.z.number().optional(),
    status: zod_1.z.enum(['active', 'reserved', 'completed', 'cancelled']).default('active'),
    aiMetadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    images: zod_1.z
        .array(zod_1.z.object({
        id: zod_1.z.string().uuid().optional(),
        listingId: zod_1.z.string().uuid().optional(),
        storageUrl: storageUrlSchema,
        qualityScore: zod_1.z.number().optional()
    }))
        .nonempty()
});
router.get('/', (_req, res) => {
    const listings = (0, inMemory_1.getListings)();
    res.json({ success: true, data: listings });
});
router.post('/', (req, res) => {
    const parsed = listingSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }
    const listingInput = {
        ...parsed.data,
        images: parsed.data.images.map((image) => ({
            storageUrl: image.storageUrl,
            qualityScore: image.qualityScore
        }))
    };
    const listing = (0, inMemory_1.createListing)(listingInput);
    return res.status(201).json({ success: true, data: listing });
});
exports.default = router;
