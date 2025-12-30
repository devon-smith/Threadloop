// Comprehensive clothing attribute taxonomy for standardized descriptions

export type ClothingCategory =
  | 'Outerwear'
  | 'Blazers'
  | 'Shirts'
  | 'Sweaters'
  | 'Dresses'
  | 'Bottoms'
  | 'Footwear'
  | 'Accessories'
  | 'Activewear'
  | 'Loungewear';

export type FitType =
  | 'oversized'
  | 'relaxed'
  | 'regular'
  | 'fitted'
  | 'slim'
  | 'tailored';

export type Neckline =
  | 'crew'
  | 'v-neck'
  | 'scoop'
  | 'turtleneck'
  | 'collar'
  | 'off-shoulder'
  | 'halter'
  | 'cowl';

export type SleeveLength =
  | 'sleeveless'
  | 'cap'
  | 'short'
  | '3/4'
  | 'long';

export type Length =
  | 'cropped'
  | 'hip'
  | 'mid-thigh'
  | 'knee'
  | 'midi'
  | 'maxi'
  | 'ankle'
  | 'floor';

export type Material =
  | 'cotton'
  | 'polyester'
  | 'wool'
  | 'denim'
  | 'leather'
  | 'silk'
  | 'linen'
  | 'cashmere'
  | 'fleece'
  | 'nylon'
  | 'spandex'
  | 'blend';

export type Pattern =
  | 'solid'
  | 'striped'
  | 'plaid'
  | 'floral'
  | 'geometric'
  | 'animal-print'
  | 'tie-dye'
  | 'graphic';

export type Color =
  | 'black'
  | 'white'
  | 'gray'
  | 'navy'
  | 'brown'
  | 'beige'
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'pink'
  | 'purple'
  | 'orange'
  | 'multi';

export type StyleVibe =
  | 'casual'
  | 'professional'
  | 'formal'
  | 'sporty'
  | 'bohemian'
  | 'vintage'
  | 'streetwear'
  | 'minimalist'
  | 'preppy'
  | 'edgy';

export type Occasion =
  | 'everyday'
  | 'work'
  | 'formal-event'
  | 'date-night'
  | 'athletic'
  | 'lounging'
  | 'party'
  | 'outdoor';

export type Brand =
  | 'Zara'
  | 'H&M'
  | 'Uniqlo'
  | 'Nike'
  | 'Adidas'
  | 'Levi\'s'
  | 'Gap'
  | 'J.Crew'
  | 'Urban Outfitters'
  | 'Patagonia'
  | 'North Face'
  | 'Aritzia'
  | 'Reformation'
  | 'Free People'
  | 'Everlane'
  | 'Other';

export interface ClothingAttributes {
  category: ClothingCategory;
  subcategory?: string;
  fit?: FitType;
  neckline?: Neckline;
  sleeveLength?: SleeveLength;
  length?: Length;
  material: Material;
  pattern: Pattern;
  primaryColor: Color;
  secondaryColor?: Color;
  styleVibe: StyleVibe[];
  occasion: Occasion[];
  brand?: Brand;
  season: ('spring' | 'summer' | 'fall' | 'winter')[];
  features?: string[]; // e.g., "pockets", "buttons", "zipper", "hood"
}

// Category-specific attribute mappings
export const CATEGORY_ATTRIBUTES: Record<ClothingCategory, {
  relevantFits: FitType[];
  relevantNecklines?: Neckline[];
  relevantSleeves?: SleeveLength[];
  relevantLengths?: Length[];
  commonFeatures: string[];
}> = {
  'Outerwear': {
    relevantFits: ['oversized', 'relaxed', 'regular', 'fitted'],
    relevantLengths: ['cropped', 'hip', 'mid-thigh', 'knee'],
    commonFeatures: ['pockets', 'zipper', 'hood', 'buttons', 'insulated', 'waterproof']
  },
  'Blazers': {
    relevantFits: ['relaxed', 'regular', 'fitted', 'tailored'],
    relevantLengths: ['cropped', 'hip'],
    commonFeatures: ['lapel', 'buttons', 'pockets', 'lined', 'shoulder-pads']
  },
  'Shirts': {
    relevantFits: ['oversized', 'relaxed', 'regular', 'fitted', 'slim'],
    relevantNecklines: ['crew', 'v-neck', 'scoop', 'collar'],
    relevantSleeves: ['sleeveless', 'cap', 'short', 'long'],
    commonFeatures: ['buttons', 'collar', 'pockets']
  },
  'Sweaters': {
    relevantFits: ['oversized', 'relaxed', 'regular', 'fitted'],
    relevantNecklines: ['crew', 'v-neck', 'turtleneck', 'cowl'],
    relevantSleeves: ['short', '3/4', 'long'],
    commonFeatures: ['ribbed-trim', 'cable-knit', 'chunky-knit']
  },
  'Dresses': {
    relevantFits: ['relaxed', 'regular', 'fitted'],
    relevantNecklines: ['crew', 'v-neck', 'scoop', 'off-shoulder', 'halter'],
    relevantSleeves: ['sleeveless', 'cap', 'short', '3/4', 'long'],
    relevantLengths: ['mini', 'knee', 'midi', 'maxi'],
    commonFeatures: ['zipper', 'buttons', 'pockets', 'lined', 'slit']
  },
  'Bottoms': {
    relevantFits: ['relaxed', 'regular', 'fitted', 'slim'],
    relevantLengths: ['cropped', 'ankle', 'floor'],
    commonFeatures: ['pockets', 'zipper', 'belt-loops', 'elastic-waist', 'high-waist']
  },
  'Footwear': {
    relevantFits: ['regular'],
    commonFeatures: ['laces', 'velcro', 'slip-on', 'cushioned', 'heel', 'platform']
  },
  'Accessories': {
    relevantFits: ['regular'],
    commonFeatures: ['adjustable', 'clasp', 'zipper']
  },
  'Activewear': {
    relevantFits: ['fitted', 'slim'],
    relevantSleeves: ['sleeveless', 'short', 'long'],
    commonFeatures: ['moisture-wicking', 'stretchy', 'breathable', 'pockets']
  },
  'Loungewear': {
    relevantFits: ['oversized', 'relaxed', 'regular'],
    relevantSleeves: ['short', 'long'],
    commonFeatures: ['elastic-waist', 'drawstring', 'soft', 'cozy']
  }
};

// Standardized description templates
export function generateStandardizedDescription(attrs: ClothingAttributes, condition: string): string {
  const parts: string[] = [];

  // Opening with brand if available
  if (attrs.brand && attrs.brand !== 'Other') {
    parts.push(`${attrs.brand} ${attrs.category.toLowerCase()}`);
  } else {
    parts.push(attrs.category);
  }

  // Add key attributes
  if (attrs.fit) {
    parts.push(`with a ${attrs.fit} fit`);
  }

  if (attrs.material) {
    parts.push(`made from ${attrs.material}`);
  }

  // Color and pattern
  const colorDesc = attrs.secondaryColor
    ? `${attrs.primaryColor} and ${attrs.secondaryColor}`
    : attrs.primaryColor;

  if (attrs.pattern === 'solid') {
    parts.push(`in ${colorDesc}`);
  } else {
    parts.push(`featuring a ${attrs.pattern} pattern in ${colorDesc}`);
  }

  // Add special features
  if (attrs.features && attrs.features.length > 0) {
    const featureList = attrs.features.slice(0, 3).join(', ');
    parts.push(`Features include ${featureList}`);
  }

  // Add condition context
  const conditionContext = {
    'new': 'Brand new with tags, never worn.',
    'like_new': 'Gently worn once or twice, in excellent condition.',
    'good': 'Well-maintained with normal signs of wear.',
    'fair': 'Some visible wear but still functional and wearable.'
  }[condition] || 'Good condition.';

  parts.push(conditionContext);

  // Add occasion/styling suggestion
  if (attrs.occasion.length > 0) {
    const occasionText = attrs.occasion[0] === 'everyday'
      ? 'Perfect for daily campus wear'
      : `Great for ${attrs.occasion[0].replace('-', ' ')}`;
    parts.push(occasionText);
  }

  return parts.join('. ') + '.';
}

// Extract size standardization
export function standardizeSize(rawSize: string, category: ClothingCategory): string {
  const normalized = rawSize.toUpperCase().trim();

  // Letter sizes (S, M, L, XL, etc.)
  if (/^(XXS|XS|S|M|L|XL|XXL|XXXL)$/.test(normalized)) {
    return normalized;
  }

  // Numeric sizes for bottoms/dresses
  if (category === 'Bottoms' || category === 'Dresses') {
    const numMatch = normalized.match(/(\d+)/);
    if (numMatch) {
      return numMatch[1];
    }
  }

  // Footwear sizes
  if (category === 'Footwear') {
    // Handle W8, M10 format
    const footwearMatch = normalized.match(/([WM])?(\d+\.?\d*)/);
    if (footwearMatch) {
      const gender = footwearMatch[1] || '';
      const size = footwearMatch[2];
      return gender ? `${gender}${size}` : size;
    }
  }

  return rawSize;
}
