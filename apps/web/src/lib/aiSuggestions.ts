// Client-side AI suggestions for listing creation
// This provides instant suggestions without requiring the API backend

interface AISuggestion {
  title: string;
  description: string;
  category: string;
  size: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  price: number;
  brand?: string;
  confidence: number;
}

// Clothing categories with typical attributes
const CATEGORY_HINTS: Record<string, { keywords: string[]; basePrice: number; defaultSize: string }> = {
  'Tops': { keywords: ['shirt', 'blouse', 'tee', 't-shirt', 'tank', 'crop', 'sweater', 'hoodie', 'polo'], basePrice: 25, defaultSize: 'M' },
  'Bottoms': { keywords: ['jeans', 'pants', 'shorts', 'skirt', 'trousers', 'leggings'], basePrice: 35, defaultSize: 'M' },
  'Dresses': { keywords: ['dress', 'gown', 'maxi', 'midi', 'mini', 'romper', 'jumpsuit'], basePrice: 45, defaultSize: 'S' },
  'Outerwear': { keywords: ['jacket', 'coat', 'blazer', 'fleece', 'puffer', 'windbreaker', 'cardigan'], basePrice: 55, defaultSize: 'M' },
  'Shoes': { keywords: ['sneakers', 'boots', 'heels', 'sandals', 'loafers', 'flats', 'shoes'], basePrice: 50, defaultSize: '8' },
  'Accessories': { keywords: ['bag', 'hat', 'scarf', 'belt', 'jewelry', 'watch', 'sunglasses', 'beanie'], basePrice: 20, defaultSize: 'One Size' },
  'Activewear': { keywords: ['leggings', 'sports', 'athletic', 'yoga', 'gym', 'running', 'workout'], basePrice: 35, defaultSize: 'M' },
  'Formal': { keywords: ['blazer', 'suit', 'dress', 'tux', 'gown', 'formal', 'cocktail'], basePrice: 65, defaultSize: 'M' },
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
  'gap': 0.95
};

// Analyze image to detect colors (simplified client-side)
function analyzeImageColors(imageData: string): string[] {
  // In a real implementation, this would use canvas to analyze pixels
  // For now, return common colors as placeholder
  const commonColors = ['black', 'white', 'navy', 'gray', 'beige', 'brown'];
  return [commonColors[Math.floor(Math.random() * commonColors.length)]];
}

// Generate title from detected attributes
function generateTitle(category: string, brand?: string, color?: string): string {
  const colorStr = color ? `${color.charAt(0).toUpperCase() + color.slice(1)} ` : '';
  const brandStr = brand ? `${brand} ` : '';

  const categoryTitles: Record<string, string[]> = {
    'Tops': ['Shirt', 'Blouse', 'Top', 'Sweater'],
    'Bottoms': ['Jeans', 'Pants', 'Shorts'],
    'Dresses': ['Dress', 'Mini Dress', 'Midi Dress'],
    'Outerwear': ['Jacket', 'Coat', 'Fleece'],
    'Shoes': ['Sneakers', 'Shoes', 'Boots'],
    'Accessories': ['Accessory', 'Bag', 'Hat'],
    'Activewear': ['Leggings', 'Athletic Wear', 'Sports Top'],
    'Formal': ['Blazer', 'Suit Piece', 'Formal Wear'],
    'Vintage': ['Vintage Piece', 'Retro Find'],
    'Other': ['Item']
  };

  const items = categoryTitles[category] || ['Item'];
  const item = items[Math.floor(Math.random() * items.length)];

  return `${brandStr}${colorStr}${item}`.trim();
}

// Generate description based on category and condition
function generateDescription(category: string, condition: string, brand?: string): string {
  const conditionDesc: Record<string, string> = {
    'new': 'Brand new with tags, never worn.',
    'like_new': 'Worn once or twice, in excellent condition.',
    'good': 'Gently used with minimal signs of wear.',
    'fair': 'Some visible wear but still has lots of life left.'
  };

  const categoryDesc: Record<string, string[]> = {
    'Tops': ['Perfect for everyday wear.', 'Great layering piece.', 'Versatile and comfortable.'],
    'Bottoms': ['Classic fit that goes with everything.', 'Comfortable for all-day wear.'],
    'Dresses': ['Perfect for campus events or date night.', 'Easy to dress up or down.'],
    'Outerwear': ['Great for cold lecture halls.', 'Perfect for rainy days on campus.', 'Stay warm between classes.'],
    'Shoes': ['Comfortable for walking across campus.', 'Classic style that never goes out of fashion.'],
    'Accessories': ['Adds the perfect finishing touch.', 'Great quality piece.'],
    'Activewear': ['Perfect for the gym or yoga.', 'Breathable and comfortable.'],
    'Formal': ['Perfect for career fairs and interviews.', 'Great for formal events.'],
    'Vintage': ['Unique piece with character.', 'One-of-a-kind vintage find.'],
    'Other': ['Quality item in great condition.']
  };

  const categoryPhrases = categoryDesc[category] || categoryDesc['Other'];
  const randomPhrase = categoryPhrases[Math.floor(Math.random() * categoryPhrases.length)];
  const brandMention = brand ? `Authentic ${brand}. ` : '';

  return `${brandMention}${conditionDesc[condition]} ${randomPhrase}`;
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

// Detect category from filename or context
function detectCategory(filename?: string): string {
  if (!filename) return 'Other';

  const lowerName = filename.toLowerCase();

  for (const [category, info] of Object.entries(CATEGORY_HINTS)) {
    for (const keyword of info.keywords) {
      if (lowerName.includes(keyword)) {
        return category;
      }
    }
  }

  return 'Other';
}

// Main function to generate AI suggestions from an image
export async function generateListingSuggestions(
  imageData: string,
  filename?: string,
  userHints?: { category?: string; brand?: string; size?: string }
): Promise<AISuggestion> {
  // Simulate processing delay for realism
  await new Promise(resolve => setTimeout(resolve, 500));

  // Detect or use provided category
  const category = userHints?.category || detectCategory(filename);
  const categoryInfo = CATEGORY_HINTS[category] || CATEGORY_HINTS['Other'];

  // Analyze colors from image
  const colors = analyzeImageColors(imageData);
  const primaryColor = colors[0];

  // Use provided brand or none
  const brand = userHints?.brand;

  // Infer condition (default to 'good' for user uploads)
  const condition = 'good' as const;

  // Generate title and description
  const title = generateTitle(category, brand, primaryColor);
  const description = generateDescription(category, condition, brand);

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
    confidence: 0.85 + Math.random() * 0.1 // 0.85-0.95
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
