"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const imageFeatureExtractor_1 = require("../ai/imageFeatureExtractor");
const attributePredictor_1 = require("../ai/attributePredictor");
const router = (0, express_1.Router)();
const requestSchema = zod_1.z
    .object({
    imageData: zod_1.z.string().min(20).optional(),
    imageUrl: zod_1.z.string().url().optional(),
    category: zod_1.z.string().optional(),
    size: zod_1.z.string().optional()
})
    .refine((value) => Boolean(value.imageData) || Boolean(value.imageUrl), {
    message: 'Provide imageData or imageUrl'
});
// Enhanced AI-powered listing suggestions
router.post('/listing-suggestions', async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }
    try {
        const { imageData, imageUrl, category, size } = parsed.data;
        // Extract image features
        const imageFeatures = imageData
            ? await (0, imageFeatureExtractor_1.extractImageFeatures)(imageData)
            : await (0, imageFeatureExtractor_1.extractImageFeaturesFromUrl)(imageUrl);
        // Predict attributes using AI model
        const prediction = await (0, attributePredictor_1.predictAttributes)(imageFeatures, {
            category: category,
            size
        });
        // Return standardized listing suggestion
        return res.json({
            success: true,
            data: {
                title: prediction.title,
                description: prediction.description,
                category: prediction.category,
                size: prediction.size,
                condition: prediction.condition,
                price: prediction.price,
                aiMetadata: {
                    attributes: prediction.attributes,
                    ...prediction.aiMetadata,
                    confidence: prediction.confidence
                }
            }
        });
    }
    catch (error) {
        console.error('AI prediction error:', error);
        return res.status(500).json({
            success: false,
            error: 'AI processing failed. Please try again.'
        });
    }
});
exports.default = router;
