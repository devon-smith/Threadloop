// Generate synthetic training data for clothing attribute prediction

import type {
  ClothingCategory,
  ClothingAttributes,
  FitType,
  Material,
  Pattern,
  Color,
  StyleVibe,
  Occasion
} from './clothingTaxonomy';

// Training data: Maps image features to clothing attributes
export interface TrainingExample {
  imageFeatures: number[]; // Mock image embedding vector
  attributes: ClothingAttributes;
  metadata: {
    confidence: number;
    dataSource: 'synthetic' | 'real';
  };
}

// Generate synthetic image features based on clothing attributes
function generateSyntheticImageFeatures(attrs: ClothingAttributes): number[] {
  // In reality, these would be CLIP embeddings
  // For synthetic data, we create deterministic feature vectors
  const features: number[] = new Array(512).fill(0);

  // Encode category (dimensions 0-9)
  const categoryMap: Record<ClothingCategory, number> = {
    'Outerwear': 0, 'Blazers': 1, 'Shirts': 2, 'Sweaters': 3, 'Dresses': 4,
    'Bottoms': 5, 'Footwear': 6, 'Accessories': 7, 'Activewear': 8, 'Loungewear': 9
  };
  features[categoryMap[attrs.category]] = 1.0;

  // Encode primary color (dimensions 10-25)
  const colorMap: Record<Color, number> = {
    'black': 10, 'white': 11, 'gray': 12, 'navy': 13, 'brown': 14, 'beige': 15,
    'red': 16, 'blue': 17, 'green': 18, 'yellow': 19, 'pink': 20, 'purple': 21,
    'orange': 22, 'multi': 23
  };
  features[colorMap[attrs.primaryColor]] = 0.9;
  if (attrs.secondaryColor) {
    features[colorMap[attrs.secondaryColor]] = 0.5;
  }

  // Encode pattern (dimensions 26-33)
  const patternMap: Record<Pattern, number> = {
    'solid': 26, 'striped': 27, 'plaid': 28, 'floral': 29,
    'geometric': 30, 'animal-print': 31, 'tie-dye': 32, 'graphic': 33
  };
  features[patternMap[attrs.pattern]] = 0.8;

  // Encode material (dimensions 34-45)
  const materialMap: Record<Material, number> = {
    'cotton': 34, 'polyester': 35, 'wool': 36, 'denim': 37, 'leather': 38, 'silk': 39,
    'linen': 40, 'cashmere': 41, 'fleece': 42, 'nylon': 43, 'spandex': 44, 'blend': 45
  };
  features[materialMap[attrs.material]] = 0.85;

  // Add some noise to make it more realistic
  for (let i = 46; i < 512; i++) {
    features[i] = (Math.random() - 0.5) * 0.3;
  }

  return features;
}

// Comprehensive synthetic dataset
export const SYNTHETIC_TRAINING_DATA: TrainingExample[] = [
  // Outerwear examples
  {
    imageFeatures: generateSyntheticImageFeatures({
      category: 'Outerwear',
      fit: 'relaxed',
      material: 'denim',
      pattern: 'solid',
      primaryColor: 'blue',
      styleVibe: ['casual'],
      occasion: ['everyday'],
      season: ['spring', 'fall']
    }),
    attributes: {
      category: 'Outerwear',
      subcategory: 'denim jacket',
      fit: 'relaxed',
      material: 'denim',
      pattern: 'solid',
      primaryColor: 'blue',
      styleVibe: ['casual', 'vintage'],
      occasion: ['everyday'],
      season: ['spring', 'fall'],
      features: ['pockets', 'buttons', 'collar']
    },
    metadata: { confidence: 0.92, dataSource: 'synthetic' }
  },
  {
    imageFeatures: generateSyntheticImageFeatures({
      category: 'Outerwear',
      fit: 'fitted',
      material: 'leather',
      pattern: 'solid',
      primaryColor: 'black',
      styleVibe: ['edgy'],
      occasion: ['party'],
      season: ['fall', 'winter']
    }),
    attributes: {
      category: 'Outerwear',
      subcategory: 'leather jacket',
      fit: 'fitted',
      material: 'leather',
      pattern: 'solid',
      primaryColor: 'black',
      styleVibe: ['edgy', 'streetwear'],
      occasion: ['party', 'date-night'],
      season: ['fall', 'winter'],
      features: ['zipper', 'pockets', 'collar']
    },
    metadata: { confidence: 0.95, dataSource: 'synthetic' }
  },
  {
    imageFeatures: generateSyntheticImageFeatures({
      category: 'Outerwear',
      fit: 'regular',
      material: 'nylon',
      pattern: 'solid',
      primaryColor: 'navy',
      styleVibe: ['sporty'],
      occasion: ['outdoor'],
      season: ['fall', 'winter', 'spring']
    }),
    attributes: {
      category: 'Outerwear',
      subcategory: 'puffer jacket',
      fit: 'regular',
      material: 'nylon',
      pattern: 'solid',
      primaryColor: 'navy',
      styleVibe: ['sporty', 'casual'],
      occasion: ['outdoor', 'everyday'],
      season: ['fall', 'winter', 'spring'],
      features: ['insulated', 'waterproof', 'hood', 'pockets']
    },
    metadata: { confidence: 0.88, dataSource: 'synthetic' }
  },

  // Shirts examples
  {
    imageFeatures: generateSyntheticImageFeatures({
      category: 'Shirts',
      fit: 'regular',
      neckline: 'collar',
      sleeveLength: 'long',
      material: 'cotton',
      pattern: 'solid',
      primaryColor: 'white',
      styleVibe: ['professional'],
      occasion: ['work'],
      season: ['spring', 'summer', 'fall', 'winter']
    }),
    attributes: {
      category: 'Shirts',
      subcategory: 'button-down',
      fit: 'regular',
      neckline: 'collar',
      sleeveLength: 'long',
      material: 'cotton',
      pattern: 'solid',
      primaryColor: 'white',
      styleVibe: ['professional', 'minimalist'],
      occasion: ['work', 'formal-event'],
      season: ['spring', 'summer', 'fall', 'winter'],
      features: ['buttons', 'collar', 'pockets']
    },
    metadata: { confidence: 0.94, dataSource: 'synthetic' }
  },
  {
    imageFeatures: generateSyntheticImageFeatures({
      category: 'Shirts',
      fit: 'oversized',
      neckline: 'crew',
      sleeveLength: 'short',
      material: 'cotton',
      pattern: 'graphic',
      primaryColor: 'black',
      styleVibe: ['streetwear'],
      occasion: ['everyday'],
      season: ['spring', 'summer', 'fall']
    }),
    attributes: {
      category: 'Shirts',
      subcategory: 't-shirt',
      fit: 'oversized',
      neckline: 'crew',
      sleeveLength: 'short',
      material: 'cotton',
      pattern: 'graphic',
      primaryColor: 'black',
      styleVibe: ['streetwear', 'casual'],
      occasion: ['everyday'],
      season: ['spring', 'summer', 'fall'],
      features: ['graphic-print']
    },
    metadata: { confidence: 0.90, dataSource: 'synthetic' }
  },

  // Dresses examples
  {
    imageFeatures: generateSyntheticImageFeatures({
      category: 'Dresses',
      fit: 'fitted',
      neckline: 'v-neck',
      sleeveLength: 'sleeveless',
      length: 'midi',
      material: 'silk',
      pattern: 'solid',
      primaryColor: 'black',
      styleVibe: ['formal'],
      occasion: ['formal-event'],
      season: ['spring', 'summer', 'fall']
    }),
    attributes: {
      category: 'Dresses',
      subcategory: 'midi dress',
      fit: 'fitted',
      neckline: 'v-neck',
      sleeveLength: 'sleeveless',
      length: 'midi',
      material: 'silk',
      pattern: 'solid',
      primaryColor: 'black',
      styleVibe: ['formal', 'minimalist'],
      occasion: ['formal-event', 'date-night'],
      season: ['spring', 'summer', 'fall'],
      features: ['zipper', 'lined']
    },
    metadata: { confidence: 0.93, dataSource: 'synthetic' }
  },
  {
    imageFeatures: generateSyntheticImageFeatures({
      category: 'Dresses',
      fit: 'relaxed',
      neckline: 'scoop',
      sleeveLength: 'short',
      length: 'maxi',
      material: 'cotton',
      pattern: 'floral',
      primaryColor: 'multi',
      styleVibe: ['bohemian'],
      occasion: ['everyday'],
      season: ['spring', 'summer']
    }),
    attributes: {
      category: 'Dresses',
      subcategory: 'maxi dress',
      fit: 'relaxed',
      neckline: 'scoop',
      sleeveLength: 'short',
      length: 'maxi',
      material: 'cotton',
      pattern: 'floral',
      primaryColor: 'multi',
      styleVibe: ['bohemian', 'casual'],
      occasion: ['everyday', 'outdoor'],
      season: ['spring', 'summer'],
      features: ['pockets', 'flowy']
    },
    metadata: { confidence: 0.89, dataSource: 'synthetic' }
  },

  // Bottoms examples
  {
    imageFeatures: generateSyntheticImageFeatures({
      category: 'Bottoms',
      fit: 'slim',
      length: 'ankle',
      material: 'denim',
      pattern: 'solid',
      primaryColor: 'blue',
      styleVibe: ['casual'],
      occasion: ['everyday'],
      season: ['spring', 'summer', 'fall', 'winter']
    }),
    attributes: {
      category: 'Bottoms',
      subcategory: 'jeans',
      fit: 'slim',
      length: 'ankle',
      material: 'denim',
      pattern: 'solid',
      primaryColor: 'blue',
      styleVibe: ['casual', 'minimalist'],
      occasion: ['everyday'],
      season: ['spring', 'summer', 'fall', 'winter'],
      features: ['pockets', 'zipper', 'belt-loops']
    },
    metadata: { confidence: 0.91, dataSource: 'synthetic' }
  },
  {
    imageFeatures: generateSyntheticImageFeatures({
      category: 'Bottoms',
      fit: 'tailored',
      length: 'ankle',
      material: 'wool',
      pattern: 'solid',
      primaryColor: 'black',
      styleVibe: ['professional'],
      occasion: ['work'],
      season: ['fall', 'winter', 'spring']
    }),
    attributes: {
      category: 'Bottoms',
      subcategory: 'dress pants',
      fit: 'tailored',
      length: 'ankle',
      material: 'wool',
      pattern: 'solid',
      primaryColor: 'black',
      styleVibe: ['professional', 'minimalist'],
      occasion: ['work', 'formal-event'],
      season: ['fall', 'winter', 'spring'],
      features: ['pockets', 'zipper', 'creased']
    },
    metadata: { confidence: 0.94, dataSource: 'synthetic' }
  },

  // Footwear examples
  {
    imageFeatures: generateSyntheticImageFeatures({
      category: 'Footwear',
      fit: 'regular',
      material: 'leather',
      pattern: 'solid',
      primaryColor: 'white',
      styleVibe: ['casual'],
      occasion: ['everyday'],
      season: ['spring', 'summer', 'fall']
    }),
    attributes: {
      category: 'Footwear',
      subcategory: 'sneakers',
      fit: 'regular',
      material: 'leather',
      pattern: 'solid',
      primaryColor: 'white',
      styleVibe: ['casual', 'sporty'],
      occasion: ['everyday', 'athletic'],
      season: ['spring', 'summer', 'fall'],
      features: ['laces', 'cushioned']
    },
    metadata: { confidence: 0.92, dataSource: 'synthetic' }
  },
  {
    imageFeatures: generateSyntheticImageFeatures({
      category: 'Footwear',
      fit: 'regular',
      material: 'leather',
      pattern: 'solid',
      primaryColor: 'black',
      styleVibe: ['professional'],
      occasion: ['work'],
      season: ['fall', 'winter', 'spring']
    }),
    attributes: {
      category: 'Footwear',
      subcategory: 'ankle boots',
      fit: 'regular',
      material: 'leather',
      pattern: 'solid',
      primaryColor: 'black',
      styleVibe: ['professional', 'edgy'],
      occasion: ['work', 'date-night'],
      season: ['fall', 'winter', 'spring'],
      features: ['heel', 'zipper']
    },
    metadata: { confidence: 0.90, dataSource: 'synthetic' }
  },

  // Sweaters examples
  {
    imageFeatures: generateSyntheticImageFeatures({
      category: 'Sweaters',
      fit: 'oversized',
      neckline: 'crew',
      sleeveLength: 'long',
      material: 'cotton',
      pattern: 'solid',
      primaryColor: 'beige',
      styleVibe: ['casual'],
      occasion: ['lounging'],
      season: ['fall', 'winter', 'spring']
    }),
    attributes: {
      category: 'Sweaters',
      subcategory: 'crewneck',
      fit: 'oversized',
      neckline: 'crew',
      sleeveLength: 'long',
      material: 'cotton',
      pattern: 'solid',
      primaryColor: 'beige',
      styleVibe: ['casual', 'minimalist'],
      occasion: ['lounging', 'everyday'],
      season: ['fall', 'winter', 'spring'],
      features: ['ribbed-trim', 'soft']
    },
    metadata: { confidence: 0.89, dataSource: 'synthetic' }
  },
  {
    imageFeatures: generateSyntheticImageFeatures({
      category: 'Sweaters',
      fit: 'fitted',
      neckline: 'turtleneck',
      sleeveLength: 'long',
      material: 'wool',
      pattern: 'solid',
      primaryColor: 'black',
      styleVibe: ['minimalist'],
      occasion: ['work'],
      season: ['fall', 'winter']
    }),
    attributes: {
      category: 'Sweaters',
      subcategory: 'turtleneck',
      fit: 'fitted',
      neckline: 'turtleneck',
      sleeveLength: 'long',
      material: 'wool',
      pattern: 'solid',
      primaryColor: 'black',
      styleVibe: ['minimalist', 'professional'],
      occasion: ['work', 'formal-event'],
      season: ['fall', 'winter'],
      features: ['ribbed-trim']
    },
    metadata: { confidence: 0.93, dataSource: 'synthetic' }
  },

  // Blazers examples
  {
    imageFeatures: generateSyntheticImageFeatures({
      category: 'Blazers',
      fit: 'tailored',
      length: 'hip',
      material: 'wool',
      pattern: 'solid',
      primaryColor: 'navy',
      styleVibe: ['professional'],
      occasion: ['work'],
      season: ['spring', 'fall', 'winter']
    }),
    attributes: {
      category: 'Blazers',
      subcategory: 'blazer',
      fit: 'tailored',
      length: 'hip',
      material: 'wool',
      pattern: 'solid',
      primaryColor: 'navy',
      styleVibe: ['professional', 'preppy'],
      occasion: ['work', 'formal-event'],
      season: ['spring', 'fall', 'winter'],
      features: ['lapel', 'buttons', 'pockets', 'lined']
    },
    metadata: { confidence: 0.95, dataSource: 'synthetic' }
  }
];

// Helper function to find most similar training examples
export function findSimilarExamples(imageFeatures: number[], topK: number = 3): TrainingExample[] {
  const similarities = SYNTHETIC_TRAINING_DATA.map(example => ({
    example,
    similarity: cosineSimilarity(imageFeatures, example.imageFeatures)
  }));

  similarities.sort((a, b) => b.similarity - a.similarity);
  return similarities.slice(0, topK).map(s => s.example);
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
