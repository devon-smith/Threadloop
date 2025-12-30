import { Router } from 'express';
import { z } from 'zod';
const router = Router();
const requestSchema = z
    .object({
    imageData: z.string().min(20).optional(),
    imageUrl: z.string().url().optional()
})
    .refine((value) => Boolean(value.imageData) || Boolean(value.imageUrl), {
    message: 'Provide imageData or imageUrl'
});
const suggestionLibrary = [
    {
        title: 'Coastal Cowgirl Denim Set',
        description: 'Light-wash denim maxi skirt with matching cropped jacket. Easy to pair with boots or sneakers.',
        category: 'Sets',
        size: 'M',
        condition: 'like_new',
        price: 70,
        aiMetadata: { palette: ['indigo', 'sand'], vibe: 'coastal cowgirl' }
    },
    {
        title: 'Black Satin Slip Dress',
        description: 'Bias-cut midi with adjustable straps. Works layered over tees for class or dressed up for nights out.',
        category: 'Dresses',
        size: 'S',
        condition: 'good',
        swapValue: 60,
        aiMetadata: { tags: ['minimalist', 'night-out'], occasions: ['formal', 'party'] }
    },
    {
        title: 'Varsity Knit + Cargo Mini',
        description: 'Chunky striped sweater paired with sage cargo mini skirt. Perfect for fall gameday layers.',
        category: 'Bundle',
        size: 'M',
        condition: 'like_new',
        price: 55,
        aiMetadata: { recommendedMatches: ['white platform sneakers'], vibe: 'preppy streetwear' }
    },
    {
        title: 'Nike Air Force 1 Shadow',
        description: 'Cream and pastel AF1 Shadow with double swooshes. Slight creasing but plenty of wear left.',
        category: 'Footwear',
        size: 'W8.5 / M7',
        condition: 'good',
        price: 85,
        aiMetadata: { palette: ['cream', 'lavender'], tags: ['sneakers'] }
    }
];
router.post('/listing-suggestions', (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }
    const suggestion = suggestionLibrary[Math.floor(Math.random() * suggestionLibrary.length)];
    return res.json({
        success: true,
        data: {
            ...suggestion,
            confidence: 0.72
        }
    });
});
export default router;
