import { Router } from 'express';
import { z } from 'zod';
import { extractImageFeatures, extractImageFeaturesFromUrl } from '../ai/imageFeatureExtractor';
import { predictAttributes } from '../ai/attributePredictor';
import type { ClothingCategory } from '../ai/clothingTaxonomy';

const router = Router();

const requestSchema = z
  .object({
    imageData: z.string().min(20).optional(),
    imageUrl: z.string().url().optional(),
    category: z.string().optional(),
    size: z.string().optional()
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
      ? await extractImageFeatures(imageData)
      : await extractImageFeaturesFromUrl(imageUrl!);

    // Predict attributes using AI model
    const prediction = await predictAttributes(imageFeatures, {
      category: category as ClothingCategory,
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
  } catch (error) {
    console.error('AI prediction error:', error);
    return res.status(500).json({
      success: false,
      error: 'AI processing failed. Please try again.'
    });
  }
});

export default router;
