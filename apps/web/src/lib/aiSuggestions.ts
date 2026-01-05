// Client-side AI suggestions for listing creation
// Uses Canvas API for actual image color analysis

interface AISuggestion {
  title: string;
  description: string;
  category: string;  // Empty string if uncertain
  size: string;      // Empty string if uncertain
  condition: 'new' | 'like_new' | 'good' | 'fair';
  price: number;     // 0 if uncertain
  brand?: string;
  confidence: number;
  // Track which fields we're confident about
  confidentFields: {
    title: boolean;
    category: boolean;
    price: boolean;
    description: boolean;
  };
}

// Clothing categories with typical attributes
const CATEGORY_HINTS: Record<string, { keywords: string[]; basePrice: number; defaultSize: string }> = {
  'Tops': { keywords: ['shirt', 'blouse', 'tee', 't-shirt', 'tank', 'crop', 'sweater', 'hoodie', 'polo', 'top'], basePrice: 25, defaultSize: 'M' },
  'Bottoms': { keywords: ['jeans', 'pants', 'shorts', 'skirt', 'trousers', 'leggings', 'chinos', 'slacks'], basePrice: 35, defaultSize: 'M' },
  'Dresses': { keywords: ['dress', 'gown', 'maxi', 'midi', 'mini', 'romper', 'jumpsuit'], basePrice: 45, defaultSize: 'S' },
  'Outerwear': { keywords: ['jacket', 'coat', 'blazer', 'fleece', 'puffer', 'windbreaker', 'cardigan', 'hoodie'], basePrice: 55, defaultSize: 'M' },
  'Shoes': { keywords: ['sneakers', 'boots', 'heels', 'sandals', 'loafers', 'flats', 'shoes', 'nike', 'adidas', 'converse'], basePrice: 50, defaultSize: '8' },
  'Accessories': { keywords: ['bag', 'hat', 'scarf', 'belt', 'jewelry', 'watch', 'sunglasses', 'beanie', 'purse', 'wallet'], basePrice: 20, defaultSize: 'One Size' },
  'Activewear': { keywords: ['leggings', 'sports', 'athletic', 'yoga', 'gym', 'running', 'workout', 'lululemon'], basePrice: 35, defaultSize: 'M' },
  'Formal': { keywords: ['blazer', 'suit', 'tux', 'gown', 'formal', 'cocktail', 'tie', 'dress shirt'], basePrice: 65, defaultSize: 'M' },
  'Vintage': { keywords: ['vintage', 'retro', '90s', '80s', '70s', 'thrift', 'antique'], basePrice: 40, defaultSize: 'M' },
  'Other': { keywords: [], basePrice: 30, defaultSize: 'M' }
};

// Premium brands that command higher prices
const PREMIUM_BRANDS: Record<string, number> = {
  'patagonia': 1.4,
  'lululemon': 1.3,
  'north face': 1.3,
  'reformation': 1.5,
  'aritzia': 1.3,
  'nike': 1.2,
  'adidas': 1.15,
  'ralph lauren': 1.25,
  'free people': 1.2,
  'anthropologie': 1.3,
  'madewell': 1.2,
  'allbirds': 1.2,
  'everlane': 1.15,
  'zara': 1.0,
  'h&m': 0.9,
  'uniqlo': 1.0,
  'gap': 0.95,
  'levis': 1.15,
  'carhartt': 1.2
};

// Color name mapping from RGB
interface ColorInfo {
  name: string;
  r: number;
  g: number;
  b: number;
}

const COLOR_PALETTE: ColorInfo[] = [
  { name: 'black', r: 0, g: 0, b: 0 },
  { name: 'white', r: 255, g: 255, b: 255 },
  { name: 'gray', r: 128, g: 128, b: 128 },
  { name: 'charcoal', r: 54, g: 54, b: 54 },
  { name: 'light gray', r: 192, g: 192, b: 192 },
  { name: 'navy', r: 0, g: 0, b: 128 },
  { name: 'blue', r: 0, g: 0, b: 255 },
  { name: 'light blue', r: 135, g: 206, b: 235 },
  { name: 'red', r: 255, g: 0, b: 0 },
  { name: 'burgundy', r: 128, g: 0, b: 32 },
  { name: 'pink', r: 255, g: 192, b: 203 },
  { name: 'green', r: 0, g: 128, b: 0 },
  { name: 'olive', r: 128, g: 128, b: 0 },
  { name: 'forest green', r: 34, g: 139, b: 34 },
  { name: 'brown', r: 139, g: 69, b: 19 },
  { name: 'tan', r: 210, g: 180, b: 140 },
  { name: 'beige', r: 245, g: 245, b: 220 },
  { name: 'cream', r: 255, g: 253, b: 208 },
  { name: 'yellow', r: 255, g: 255, b: 0 },
  { name: 'orange', r: 255, g: 165, b: 0 },
  { name: 'purple', r: 128, g: 0, b: 128 },
  { name: 'lavender', r: 230, g: 230, b: 250 },
];

// Calculate color distance
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
}

// Find closest named color
function getClosestColorName(r: number, g: number, b: number): string {
  let closestColor = 'gray';
  let minDistance = Infinity;

  for (const color of COLOR_PALETTE) {
    const distance = colorDistance(r, g, b, color.r, color.g, color.b);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color.name;
    }
  }

  return closestColor;
}

// Analyze image to detect dominant colors using Canvas
async function analyzeImageColors(imageData: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(['gray']);
          return;
        }

        // Scale down for faster processing
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageDataObj.data;

        // Sample pixels and count colors
        const colorCounts: Record<string, number> = {};
        const step = 4 * 4; // Sample every 4th pixel for speed

        for (let i = 0; i < pixels.length; i += step) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          const colorName = getClosestColorName(r, g, b);
          colorCounts[colorName] = (colorCounts[colorName] || 0) + 1;
        }

        // Sort by frequency and get top colors
        const sortedColors = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([color]) => color);

        // Filter out background-like colors if we have other options
        const nonBackgroundColors = sortedColors.filter(c =>
          !['white', 'beige', 'cream', 'light gray'].includes(c)
        );

        const result = nonBackgroundColors.length > 0
          ? nonBackgroundColors.slice(0, 3)
          : sortedColors.slice(0, 3);

        resolve(result.length > 0 ? result : ['gray']);
      } catch (error) {
        console.error('Color analysis error:', error);
        resolve(['gray']);
      }
    };

    img.onerror = () => {
      resolve(['gray']);
    };

    img.src = imageData;
  });
}

// Detect aspect ratio to help identify clothing type
async function analyzeImageShape(imageData: string): Promise<{ aspectRatio: number; isVertical: boolean }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      resolve({
        aspectRatio,
        isVertical: aspectRatio < 1
      });
    };
    img.onerror = () => {
      resolve({ aspectRatio: 1, isVertical: false });
    };
    img.src = imageData;
  });
}

// Smart category detection with multiple signals
async function detectCategory(
  filename?: string,
  colors?: string[],
  aspectRatio?: number
): Promise<{ category: string; itemType: string; confidence: number }> {
  let bestCategory = 'Other';
  let bestItemType = 'Clothing Item';
  let confidence = 0.5;

  // Check filename for hints
  if (filename) {
    const lowerName = filename.toLowerCase();

    for (const [category, info] of Object.entries(CATEGORY_HINTS)) {
      for (const keyword of info.keywords) {
        if (lowerName.includes(keyword)) {
          bestCategory = category;
          bestItemType = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          confidence = 0.9;
          return { category: bestCategory, itemType: bestItemType, confidence };
        }
      }
    }
  }

  // Use aspect ratio as a hint
  if (aspectRatio !== undefined) {
    if (aspectRatio > 1.5) {
      // Very wide - likely pants laid flat, or accessories
      bestCategory = 'Bottoms';
      bestItemType = 'Pants';
      confidence = 0.6;
    } else if (aspectRatio < 0.6) {
      // Very tall/vertical - likely dress or full outfit
      bestCategory = 'Dresses';
      bestItemType = 'Dress';
      confidence = 0.6;
    } else if (aspectRatio > 0.8 && aspectRatio < 1.2) {
      // Square-ish - could be top, folded item
      bestCategory = 'Tops';
      bestItemType = 'Top';
      confidence = 0.5;
    }
  }

  // Default to a reasonable guess based on common items
  if (bestCategory === 'Other') {
    // Most uploaded items are tops or bottoms
    bestCategory = 'Tops';
    bestItemType = 'Top';
    confidence = 0.4;
  }

  return { category: bestCategory, itemType: bestItemType, confidence };
}

// Generate a descriptive title
function generateTitle(
  itemType: string,
  primaryColor: string,
  brand?: string
): string {
  const colorStr = primaryColor.charAt(0).toUpperCase() + primaryColor.slice(1);

  // Clean up item type
  let cleanItemType = itemType;
  if (cleanItemType === 'Top') cleanItemType = 'Top';
  if (cleanItemType === 'Pants') cleanItemType = 'Pants';

  if (brand) {
    return `${brand} ${colorStr} ${cleanItemType}`;
  }

  return `${colorStr} ${cleanItemType}`;
}

// Generate description based on category and condition
function generateDescription(
  category: string,
  itemType: string,
  condition: string,
  primaryColor: string,
  brand?: string
): string {
  const conditionDesc: Record<string, string> = {
    'new': 'Brand new with tags, never worn.',
    'like_new': 'Worn once or twice, in excellent condition.',
    'good': 'Gently used with minimal signs of wear.',
    'fair': 'Some visible wear but still has lots of life left.'
  };

  const categoryPhrases: Record<string, string[]> = {
    'Tops': [
      'Perfect for everyday wear or layering.',
      'Versatile piece that goes with everything.',
      'Great for class or casual outings.'
    ],
    'Bottoms': [
      'Comfortable fit, perfect for all-day wear.',
      'Classic style that pairs with anything.',
      'Great for campus life or going out.'
    ],
    'Dresses': [
      'Perfect for campus events or date night.',
      'Easy to dress up or down.',
      'A standout piece for any occasion.'
    ],
    'Outerwear': [
      'Great for cold lecture halls and rainy days.',
      'Perfect for layering between classes.',
      'Stay warm and stylish on campus.'
    ],
    'Shoes': [
      'Comfortable for walking across campus all day.',
      'Classic style that never goes out of fashion.',
      'Perfect condition for everyday wear.'
    ],
    'Accessories': [
      'Adds the perfect finishing touch to any outfit.',
      'Great quality piece.',
      'Versatile accessory for any style.'
    ],
    'Activewear': [
      'Perfect for the gym, yoga, or running.',
      'Breathable and comfortable for workouts.',
      'Great for staying active on campus.'
    ],
    'Formal': [
      'Perfect for career fairs and interviews.',
      'Great for formal campus events.',
      'Professional look for important occasions.'
    ],
    'Vintage': [
      'Unique piece with character.',
      'One-of-a-kind vintage find.',
      'Retro style that stands out.'
    ],
    'Other': [
      'Quality item in great condition.',
      'Versatile piece for your wardrobe.',
      'Great addition to any closet.'
    ]
  };

  const phrases = categoryPhrases[category] || categoryPhrases['Other'];
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

  const brandMention = brand ? `Authentic ${brand}. ` : '';
  const colorMention = `Beautiful ${primaryColor} color. `;

  return `${brandMention}${colorMention}${conditionDesc[condition]} ${randomPhrase}`;
}

// Estimate price based on category, condition, and brand
function estimatePrice(category: string, condition: string, brand?: string): number {
  const categoryInfo = CATEGORY_HINTS[category] || CATEGORY_HINTS['Other'];
  let price = categoryInfo.basePrice;

  // Adjust for condition
  const conditionMultiplier: Record<string, number> = {
    'new': 1.3,
    'like_new': 1.1,
    'good': 1.0,
    'fair': 0.7
  };
  price *= conditionMultiplier[condition] || 1.0;

  // Adjust for brand
  if (brand) {
    const brandKey = brand.toLowerCase();
    const brandMultiplier = PREMIUM_BRANDS[brandKey] || 1.0;
    price *= brandMultiplier;
  }

  return Math.round(price);
}

// Main function to generate AI suggestions from an image
export async function generateListingSuggestions(
  imageData: string,
  filename?: string,
  userHints?: { category?: string; brand?: string; size?: string }
): Promise<AISuggestion> {
  // Analyze image colors using Canvas
  const colors = await analyzeImageColors(imageData);
  const primaryColor = colors[0] || 'gray';

  // Analyze image shape
  const shapeInfo = await analyzeImageShape(imageData);

  // Detect category and item type
  const categoryResult = await detectCategory(filename, colors, shapeInfo.aspectRatio);

  // Use user-provided category if available
  const category = userHints?.category || categoryResult.category;
  const itemType = categoryResult.itemType;
  const categoryInfo = CATEGORY_HINTS[category] || CATEGORY_HINTS['Other'];

  // Use provided brand or none
  const brand = userHints?.brand;

  // Infer condition (default to 'good' for user uploads)
  const condition = 'good' as const;

  // Generate title with actual detected color
  const title = generateTitle(itemType, primaryColor, brand);

  // Generate description
  const description = generateDescription(category, itemType, condition, primaryColor, brand);

  // Estimate price
  const price = estimatePrice(category, condition, brand);

  // Get size
  const size = userHints?.size || categoryInfo.defaultSize;

  return {
    title,
    description,
    category,
    size,
    condition,
    price,
    brand,
    confidence: categoryResult.confidence
  };
}

// Quick price suggestion based on category and condition
export function suggestPrice(category: string, condition: string, brand?: string): { suggested: number; range: { min: number; max: number } } {
  const price = estimatePrice(category, condition, brand);

  return {
    suggested: price,
    range: {
      min: Math.round(price * 0.7),
      max: Math.round(price * 1.3)
    }
  };
}

// Demand analysis for a category
export function getCategoryDemand(category: string): { level: 'high' | 'medium' | 'low'; reason: string } {
  const now = new Date();
  const month = now.getMonth();

  // Seasonal demand patterns
  const winterCategories = ['Outerwear', 'Accessories'];
  const summerCategories = ['Dresses', 'Activewear', 'Shoes'];
  const alwaysHigh = ['Tops', 'Bottoms'];
  const formalSeasons = [1, 2, 4, 5, 9, 10]; // Career fair and graduation months

  const isWinter = month >= 10 || month <= 2;
  const isSummer = month >= 5 && month <= 8;
  const isFormalSeason = formalSeasons.includes(month);

  if (alwaysHigh.includes(category)) {
    return { level: 'high', reason: 'Basics are always in demand' };
  }

  if (isWinter && winterCategories.includes(category)) {
    return { level: 'high', reason: 'Winter essentials are trending' };
  }

  if (isSummer && summerCategories.includes(category)) {
    return { level: 'high', reason: 'Perfect for the warm season' };
  }

  if (isFormalSeason && category === 'Formal') {
    return { level: 'high', reason: 'Career fair and interview season' };
  }

  if (category === 'Vintage') {
    return { level: 'medium', reason: 'Unique items attract collectors' };
  }

  return { level: 'medium', reason: 'Steady campus interest' };
}
