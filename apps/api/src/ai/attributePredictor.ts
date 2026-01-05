// AI model for predicting clothing attributes from image features

import type { ClothingAttributes, ClothingCategory, Material, Pattern, StyleVibe, Occasion } from './clothingTaxonomy';
import { generateStandardizedDescription, standardizeSize, CATEGORY_ATTRIBUTES } from './clothingTaxonomy';
import { findSimilarExamples } from './syntheticTrainingData';
import type { ImageFeatures } from './imageFeatureExtractor';

export interface PredictionResult {
  attributes: ClothingAttributes;
  title: string;
  description: string;
  category: ClothingCategory;
  size: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  price?: number;
  confidence: number;
  aiMetadata: {
    detectedColors: string[];
    detectedObjects: string[];
    modelVersion: string;
    processingTime: number;
  };
}

// Predict clothing attributes from image features
export async function predictAttributes(
  imageFeatures: ImageFeatures,
  userHints?: {
    category?: ClothingCategory;
    size?: string;
  }
): Promise<PredictionResult> {
  const startTime = Date.now();

  // Find similar training examples
  const similarExamples = findSimilarExamples(imageFeatures.embedding, 3);

  // Aggregate attributes from similar examples (ensemble prediction)
  const predictedCategory = userHints?.category ||
    mostCommon(similarExamples.map(ex => ex.attributes.category));

  // Build attribute predictions
  const attributes: ClothingAttributes = {
    category: predictedCategory,
    subcategory: inferSubcategory(imageFeatures.detectedObjects, predictedCategory),
    fit: mostCommon(similarExamples.map(ex => ex.attributes.fit).filter(Boolean)),
    neckline: mostCommon(similarExamples.map(ex => ex.attributes.neckline).filter(Boolean)),
    sleeveLength: mostCommon(similarExamples.map(ex => ex.attributes.sleeveLength).filter(Boolean)),
    length: mostCommon(similarExamples.map(ex => ex.attributes.length).filter(Boolean)),
    material: mostCommon(similarExamples.map(ex => ex.attributes.material)),
    pattern: inferPattern(imageFeatures.detectedObjects),
    primaryColor: inferPrimaryColor(imageFeatures.dominantColors),
    secondaryColor: imageFeatures.dominantColors.length > 1 ?
      inferSecondaryColor(imageFeatures.dominantColors) : undefined,
    styleVibe: aggregateStyleVibes(similarExamples),
    occasion: aggregateOccasions(similarExamples),
    season: inferSeasons(predictedCategory, similarExamples),
    features: inferFeatures(predictedCategory, imageFeatures.detectedObjects)
  };

  // Generate standardized title
  const title = generateTitle(attributes);

  // Infer condition (default to 'good' for mock)
  const condition = inferCondition(imageFeatures);

  // Generate standardized description
  const description = generateStandardizedDescription(attributes, condition);

  // Infer size
  const size = userHints?.size || inferSize(predictedCategory);

  // Estimate price based on category and condition
  const price = estimatePrice(attributes, condition);

  // Calculate overall confidence
  const confidence = calculateConfidence(imageFeatures, similarExamples);

  // Check if we should auto-fill or return minimal data
  const canAutoFill = shouldAutoFill(confidence, imageFeatures.detectedObjects);
  
  if (!canAutoFill) {
    // Return minimal prediction when confidence is low
    const processingTime = Date.now() - startTime;
    return {
      attributes: {
        category: 'Bottoms' as ClothingCategory, // Default to most common
        subcategory: undefined,
        fit: undefined,
        neckline: undefined,
        sleeveLength: undefined,
        length: undefined,
        material: 'cotton' as Material,
        pattern: 'solid' as Pattern,
        primaryColor: inferPrimaryColor(imageFeatures.dominantColors),
        secondaryColor: imageFeatures.dominantColors.length > 1 ?
          inferSecondaryColor(imageFeatures.dominantColors) : undefined,
        styleVibe: ['casual'] as StyleVibe[],
        occasion: ['everyday'] as Occasion[],
        season: ['spring', 'summer', 'fall', 'winter'],
        features: []
      },
      title: 'Item Description',
      description: 'Please manually describe this item.',
      category: 'Bottoms' as ClothingCategory,
      size: userHints?.size || 'M',
      condition: 'good',
      price: undefined,
      confidence,
      aiMetadata: {
        detectedColors: imageFeatures.dominantColors,
        detectedObjects: imageFeatures.detectedObjects,
        modelVersion: 'v1.0-synthetic',
        processingTime
      }
    };
  }

  const processingTime = Date.now() - startTime;

  return {
    attributes,
    title,
    description,
    category: predictedCategory,
    size,
    condition,
    price,
    confidence,
    aiMetadata: {
      detectedColors: imageFeatures.dominantColors,
      detectedObjects: imageFeatures.detectedObjects,
      modelVersion: 'v1.0-synthetic',
      processingTime
    }
  };
}

// Helper functions

function mostCommon<T>(arr: (T | undefined)[]): T {
  const filtered = arr.filter((x): x is T => x !== undefined);
  if (filtered.length === 0) return arr[0] as T;

  const counts = new Map<T, number>();
  filtered.forEach(item => {
    counts.set(item, (counts.get(item) || 0) + 1);
  });

  let maxCount = 0;
  let mostCommonItem = filtered[0];
  counts.forEach((count, item) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonItem = item;
    }
  });

  return mostCommonItem;
}

function inferSubcategory(objects: string[], category: ClothingCategory): string | undefined {
  const subcategoryMappings: Record<ClothingCategory, Record<string, string>> = {
    'Outerwear': {
      'jacket': 'jacket',
      'coat': 'coat',
      'hoodie': 'hoodie',
      'vest': 'vest'
    },
    'Shirts': {
      'collar': 'button-down',
      'shirt': 't-shirt',
      'blouse': 'blouse'
    },
    'Dresses': {
      'dress': 'dress',
      'full-length': 'maxi dress',
      'midi': 'midi dress'
    },
    'Bottoms': {
      'pants': 'pants',
      'jeans': 'jeans',
      'shorts': 'shorts',
      'skirt': 'skirt'
    },
    'Footwear': {
      'sneakers': 'sneakers',
      'boots': 'boots',
      'sandals': 'sandals',
      'heels': 'heels'
    },
    'Sweaters': {
      'sweater': 'sweater',
      'cardigan': 'cardigan',
      'hoodie': 'hoodie'
    },
    'Blazers': {
      'blazer': 'blazer',
      'suit': 'suit jacket'
    },
    'Accessories': {},
    'Activewear': {},
    'Loungewear': {}
  };

  for (const obj of objects) {
    const subcategory = subcategoryMappings[category]?.[obj];
    if (subcategory) return subcategory;
  }

  return undefined;
}

function inferPattern(objects: string[]): ClothingAttributes['pattern'] {
  if (objects.some(obj => obj.includes('stripe'))) return 'striped';
  if (objects.some(obj => obj.includes('floral'))) return 'floral';
  if (objects.some(obj => obj.includes('plaid'))) return 'plaid';
  if (objects.some(obj => obj.includes('print') || obj.includes('graphic'))) return 'graphic';
  return 'solid';
}

function inferPrimaryColor(colors: string[]): ClothingAttributes['primaryColor'] {
  const colorMap: Record<string, ClothingAttributes['primaryColor']> = {
    'black': 'black', 'white': 'white', 'gray': 'gray', 'grey': 'gray',
    'navy': 'navy', 'brown': 'brown', 'beige': 'beige', 'tan': 'beige',
    'red': 'red', 'blue': 'blue', 'green': 'green', 'yellow': 'yellow',
    'pink': 'pink', 'purple': 'purple', 'orange': 'orange'
  };

  return colorMap[colors[0]] || 'black';
}

function inferSecondaryColor(colors: string[]): ClothingAttributes['secondaryColor'] {
  if (colors.length < 2) return undefined;

  const colorMap: Record<string, ClothingAttributes['secondaryColor']> = {
    'black': 'black', 'white': 'white', 'gray': 'gray', 'grey': 'gray',
    'navy': 'navy', 'brown': 'brown', 'beige': 'beige', 'tan': 'beige',
    'red': 'red', 'blue': 'blue', 'green': 'green', 'yellow': 'yellow',
    'pink': 'pink', 'purple': 'purple', 'orange': 'orange'
  };

  return colorMap[colors[1]];
}

function aggregateStyleVibes(examples: any[]): ClothingAttributes['styleVibe'] {
  const allVibes = examples.flatMap(ex => ex.attributes.styleVibe);
  const uniqueVibes = Array.from(new Set(allVibes));
  return uniqueVibes.slice(0, 2) as ClothingAttributes['styleVibe'];
}

function aggregateOccasions(examples: any[]): ClothingAttributes['occasion'] {
  const allOccasions = examples.flatMap(ex => ex.attributes.occasion);
  const uniqueOccasions = Array.from(new Set(allOccasions));
  return uniqueOccasions.slice(0, 2) as ClothingAttributes['occasion'];
}

function inferSeasons(category: ClothingCategory, examples: any[]): ('spring' | 'summer' | 'fall' | 'winter')[] {
  const allSeasons = examples.flatMap(ex => ex.attributes.season);
  const uniqueSeasons = Array.from(new Set(allSeasons)) as ('spring' | 'summer' | 'fall' | 'winter')[];

  if (uniqueSeasons.length > 0) return uniqueSeasons;

  // Default seasons by category
  const seasonDefaults: Record<ClothingCategory, ('spring' | 'summer' | 'fall' | 'winter')[]> = {
    'Outerwear': ['fall', 'winter', 'spring'],
    'Sweaters': ['fall', 'winter', 'spring'],
    'Dresses': ['spring', 'summer', 'fall'],
    'Shirts': ['spring', 'summer', 'fall'],
    'Bottoms': ['spring', 'summer', 'fall', 'winter'],
    'Footwear': ['spring', 'summer', 'fall'],
    'Blazers': ['spring', 'fall', 'winter'],
    'Accessories': ['fall', 'winter'],
    'Activewear': ['spring', 'summer', 'fall'],
    'Loungewear': ['fall', 'winter', 'spring']
  };

  return seasonDefaults[category] || ['spring', 'summer', 'fall', 'winter'];
}

function inferFeatures(category: ClothingCategory, objects: string[]): string[] {
  const categoryFeatures = CATEGORY_ATTRIBUTES[category]?.commonFeatures || [];

  // Add detected features from objects
  const detectedFeatures: string[] = [];
  if (objects.includes('zipper')) detectedFeatures.push('zipper');
  if (objects.includes('buttons')) detectedFeatures.push('buttons');
  if (objects.includes('pockets')) detectedFeatures.push('pockets');
  if (objects.includes('hood')) detectedFeatures.push('hood');

  return Array.from(new Set([...categoryFeatures.slice(0, 2), ...detectedFeatures])).slice(0, 4);
}

function generateTitle(attrs: ClothingAttributes): string {
  const parts: string[] = [];

  if (attrs.primaryColor !== 'multi') {
    parts.push(attrs.primaryColor.charAt(0).toUpperCase() + attrs.primaryColor.slice(1));
  }

  if (attrs.pattern !== 'solid') {
    parts.push(attrs.pattern.charAt(0).toUpperCase() + attrs.pattern.slice(1));
  }

  if (attrs.subcategory) {
    parts.push(attrs.subcategory.split(' ').map(w =>
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' '));
  } else {
    parts.push(attrs.category);
  }

  if (attrs.brand && attrs.brand !== 'Other') {
    parts.unshift(attrs.brand);
  }

  return parts.join(' ');
}

function inferCondition(imageFeatures: ImageFeatures): 'new' | 'like_new' | 'good' | 'fair' {
  // In reality, this would analyze image quality, wear patterns, etc.
  // For mock, use confidence as proxy
  if (imageFeatures.confidence > 0.92) return 'like_new';
  if (imageFeatures.confidence > 0.88) return 'good';
  if (imageFeatures.confidence > 0.82) return 'fair';
  return 'good'; // default
}

function inferSize(category: ClothingCategory): string {
  // Default size inference
  const sizeDefaults: Record<ClothingCategory, string> = {
    'Outerwear': 'M',
    'Blazers': 'M',
    'Shirts': 'M',
    'Sweaters': 'M',
    'Dresses': 'M',
    'Bottoms': '30',
    'Footwear': 'W8',
    'Accessories': 'One Size',
    'Activewear': 'M',
    'Loungewear': 'M'
  };

  return sizeDefaults[category] || 'M';
}

function estimatePrice(attrs: ClothingAttributes, condition: string): number {
  // Base price by category
  const basePrices: Record<ClothingCategory, number> = {
    'Outerwear': 55,
    'Blazers': 70,
    'Shirts': 25,
    'Sweaters': 35,
    'Dresses': 45,
    'Bottoms': 40,
    'Footwear': 60,
    'Accessories': 20,
    'Activewear': 30,
    'Loungewear': 25
  };

  let price = basePrices[attrs.category] || 35;

  // Adjust for condition
  const conditionMultiplier = {
    'new': 1.5,
    'like_new': 1.2,
    'good': 1.0,
    'fair': 0.7
  }[condition] || 1.0;

  price *= conditionMultiplier;

  // Adjust for brand
  if (attrs.brand && ['Patagonia', 'North Face', 'Aritzia', 'Reformation'].includes(attrs.brand)) {
    price *= 1.3;
  }

  return Math.round(price);
}

function calculateConfidence(imageFeatures: ImageFeatures, similarExamples: any[]): number {
  // Combine image feature confidence with similarity scores
  const baseConfidence = imageFeatures.confidence;
  const avgSimilarityConfidence = similarExamples.reduce((sum, ex) =>
    sum + ex.metadata.confidence, 0) / similarExamples.length;

  return Math.min(0.99, (baseConfidence + avgSimilarityConfidence) / 2);
}

// Only auto-fill if we have high confidence in the prediction
function shouldAutoFill(confidence: number, detectedObjects: string[]): boolean {
  // Require higher confidence for auto-fill
  if (confidence < 0.85) return false;
  
  // Require clear object detection for category classification
  const hasClearObjects = detectedObjects.some(obj => 
    ['clothing', 'pants', 'shirt', 'dress', 'jacket', 'sweater', 'skirt', 'shorts'].includes(obj)
  );
  
  return hasClearObjects;
}
