import { Router } from 'express';
import { z } from 'zod';
import { extractImageFeatures, extractImageFeaturesFromUrl } from '../ai/imageFeatureExtractor';
import { predictAttributes } from '../ai/attributePredictor';
import { analyzeClothingImage, isVisionConfigured } from '../ai/visionAnalyzer';
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

    // Try Google Vision API first if configured
    if (isVisionConfigured() && imageData) {
      try {
        const visionResult = await analyzeClothingImage(imageData);
        
        return res.json({
          success: true,
          data: {
            title: visionResult.suggestedTitle,
            description: visionResult.suggestedDescription,
            category: visionResult.category,
            subcategory: visionResult.subcategory,
            size: size || 'M',
            condition: visionResult.condition,
            price: undefined, // Let user set price
            aiMetadata: {
              primaryColor: visionResult.primaryColor,
              secondaryColor: visionResult.secondaryColor,
              pattern: visionResult.pattern,
              qualityScore: visionResult.qualityScore,
              labels: visionResult.allLabels,
              confidence: visionResult.confidence,
              source: 'google-vision'
            }
          }
        });
      } catch (visionError) {
        console.warn('Vision API failed, falling back to mock:', visionError);
        // Fall through to mock prediction
      }
    }

    // Fallback: Use mock prediction
    const imageFeatures = imageData
      ? await extractImageFeatures(imageData)
      : await extractImageFeaturesFromUrl(imageUrl!);

    const prediction = await predictAttributes(imageFeatures, {
      category: category as ClothingCategory,
      size
    });

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
          confidence: prediction.confidence,
          source: 'mock-prediction'
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

// Check Vision API status
router.get('/status', (_req, res) => {
  res.json({
    success: true,
    visionEnabled: isVisionConfigured(),
    features: ['label-detection', 'color-extraction', 'pattern-detection', 'quality-assessment']
  });
});

export default router;
