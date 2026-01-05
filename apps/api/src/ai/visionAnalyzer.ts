// Hierarchical Clothing Analyzer using Google Cloud Vision API
import vision from '@google-cloud/vision';

// Types for the hierarchical analysis
export interface ClothingAnalysis {
  // Stage 1: Category
  category: string;
  subcategory: string;
  categoryConfidence: number;
  
  // Stage 2: Colors
  primaryColor: string;
  secondaryColor?: string;
  pattern: string;
  
  // Stage 3: Quality/Condition
  condition: 'new' | 'like_new' | 'good' | 'fair';
  qualityScore: number;
  
  // Metadata
  suggestedTitle: string;
  suggestedDescription: string;
  allLabels: string[];
  confidence: number;
}

// Category mappings from Vision API labels
const CATEGORY_LABEL_MAP: Record<string, { category: string; subcategory: string }> = {
  // Tops
  't-shirt': { category: 'Tops', subcategory: 't-shirt' },
  'shirt': { category: 'Tops', subcategory: 'shirt' },
  'blouse': { category: 'Tops', subcategory: 'blouse' },
  'polo shirt': { category: 'Tops', subcategory: 'polo' },
  'tank top': { category: 'Tops', subcategory: 'tank top' },
  'crop top': { category: 'Tops', subcategory: 'crop top' },
  'top': { category: 'Tops', subcategory: 'top' },
  
  // Bottoms
  'jeans': { category: 'Bottoms', subcategory: 'jeans' },
  'pants': { category: 'Bottoms', subcategory: 'pants' },
  'trousers': { category: 'Bottoms', subcategory: 'pants' },
  'shorts': { category: 'Bottoms', subcategory: 'shorts' },
  'skirt': { category: 'Bottoms', subcategory: 'skirt' },
  'leggings': { category: 'Bottoms', subcategory: 'leggings' },
  'sweatpants': { category: 'Bottoms', subcategory: 'sweatpants' },
  
  // Dresses
  'dress': { category: 'Dresses', subcategory: 'dress' },
  'gown': { category: 'Dresses', subcategory: 'gown' },
  'sundress': { category: 'Dresses', subcategory: 'sundress' },
  'maxi dress': { category: 'Dresses', subcategory: 'maxi dress' },
  
  // Outerwear
  'jacket': { category: 'Outerwear', subcategory: 'jacket' },
  'coat': { category: 'Outerwear', subcategory: 'coat' },
  'blazer': { category: 'Outerwear', subcategory: 'blazer' },
  'hoodie': { category: 'Outerwear', subcategory: 'hoodie' },
  'cardigan': { category: 'Outerwear', subcategory: 'cardigan' },
  'sweater': { category: 'Outerwear', subcategory: 'sweater' },
  'vest': { category: 'Outerwear', subcategory: 'vest' },
  'parka': { category: 'Outerwear', subcategory: 'parka' },
  
  // Footwear
  'shoe': { category: 'Footwear', subcategory: 'shoes' },
  'shoes': { category: 'Footwear', subcategory: 'shoes' },
  'sneakers': { category: 'Footwear', subcategory: 'sneakers' },
  'boots': { category: 'Footwear', subcategory: 'boots' },
  'sandals': { category: 'Footwear', subcategory: 'sandals' },
  'heels': { category: 'Footwear', subcategory: 'heels' },
  'loafers': { category: 'Footwear', subcategory: 'loafers' },
  
  // Accessories
  'hat': { category: 'Accessories', subcategory: 'hat' },
  'cap': { category: 'Accessories', subcategory: 'cap' },
  'scarf': { category: 'Accessories', subcategory: 'scarf' },
  'belt': { category: 'Accessories', subcategory: 'belt' },
  'bag': { category: 'Accessories', subcategory: 'bag' },
  'handbag': { category: 'Accessories', subcategory: 'handbag' },
  'backpack': { category: 'Accessories', subcategory: 'backpack' },
  'watch': { category: 'Accessories', subcategory: 'watch' },
  'sunglasses': { category: 'Accessories', subcategory: 'sunglasses' },
  'jewelry': { category: 'Accessories', subcategory: 'jewelry' },
  
  // Activewear
  'sportswear': { category: 'Activewear', subcategory: 'sportswear' },
  'athletic wear': { category: 'Activewear', subcategory: 'athletic wear' },
  'yoga pants': { category: 'Activewear', subcategory: 'yoga pants' },
  'sports bra': { category: 'Activewear', subcategory: 'sports bra' },
};

// Color name mapping from RGB
const COLOR_NAMES: Array<{ name: string; r: number; g: number; b: number }> = [
  { name: 'black', r: 0, g: 0, b: 0 },
  { name: 'white', r: 255, g: 255, b: 255 },
  { name: 'gray', r: 128, g: 128, b: 128 },
  { name: 'red', r: 255, g: 0, b: 0 },
  { name: 'burgundy', r: 128, g: 0, b: 32 },
  { name: 'pink', r: 255, g: 192, b: 203 },
  { name: 'orange', r: 255, g: 165, b: 0 },
  { name: 'yellow', r: 255, g: 255, b: 0 },
  { name: 'green', r: 0, g: 128, b: 0 },
  { name: 'olive', r: 128, g: 128, b: 0 },
  { name: 'teal', r: 0, g: 128, b: 128 },
  { name: 'blue', r: 0, g: 0, b: 255 },
  { name: 'navy', r: 0, g: 0, b: 128 },
  { name: 'purple', r: 128, g: 0, b: 128 },
  { name: 'brown', r: 139, g: 69, b: 19 },
  { name: 'tan', r: 210, g: 180, b: 140 },
  { name: 'beige', r: 245, g: 245, b: 220 },
  { name: 'cream', r: 255, g: 253, b: 208 },
  { name: 'coral', r: 255, g: 127, b: 80 },
  { name: 'maroon', r: 128, g: 0, b: 0 },
];

// Pattern detection keywords
const PATTERN_KEYWORDS: Record<string, string> = {
  'striped': 'striped',
  'stripes': 'striped',
  'plaid': 'plaid',
  'checkered': 'plaid',
  'floral': 'floral',
  'flower': 'floral',
  'polka dot': 'polka dot',
  'dots': 'polka dot',
  'graphic': 'graphic',
  'print': 'print',
  'paisley': 'paisley',
  'camouflage': 'camo',
  'tie-dye': 'tie-dye',
  'animal print': 'animal print',
  'leopard': 'animal print',
};

// Initialize Vision client
let visionClient: InstanceType<typeof vision.ImageAnnotatorClient> | null = null;

function getVisionClient(): InstanceType<typeof vision.ImageAnnotatorClient> {
  if (!visionClient) {
    // Check for credentials
    const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS;
    if (credentials) {
      // Parse JSON credentials from environment variable
      const parsedCredentials = JSON.parse(credentials);
      visionClient = new vision.ImageAnnotatorClient({
        credentials: parsedCredentials
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use file-based credentials
      visionClient = new vision.ImageAnnotatorClient();
    } else {
      throw new Error('Google Cloud credentials not configured. Set GOOGLE_CLOUD_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS.');
    }
  }
  return visionClient;
}

// Helper: Find closest color name
function findClosestColor(r: number, g: number, b: number): string {
  let closestColor = 'gray';
  let minDistance = Infinity;
  
  for (const color of COLOR_NAMES) {
    const distance = Math.sqrt(
      Math.pow(r - color.r, 2) +
      Math.pow(g - color.g, 2) +
      Math.pow(b - color.b, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color.name;
    }
  }
  
  return closestColor;
}

// Helper: Detect pattern from labels
function detectPattern(labels: string[]): string {
  const labelText = labels.join(' ').toLowerCase();
  
  for (const [keyword, pattern] of Object.entries(PATTERN_KEYWORDS)) {
    if (labelText.includes(keyword)) {
      return pattern;
    }
  }
  
  return 'solid';
}

// Helper: Detect category from labels
function detectCategory(labels: Array<{ description: string; score: number }>): {
  category: string;
  subcategory: string;
  confidence: number;
} {
  let bestMatch = { category: 'Other', subcategory: 'item', confidence: 0.5 };
  
  for (const label of labels) {
    const labelLower = label.description.toLowerCase();
    
    // Check direct matches
    if (CATEGORY_LABEL_MAP[labelLower]) {
      const match = CATEGORY_LABEL_MAP[labelLower];
      if (label.score > bestMatch.confidence) {
        bestMatch = {
          category: match.category,
          subcategory: match.subcategory,
          confidence: label.score
        };
      }
    }
    
    // Check partial matches
    for (const [key, value] of Object.entries(CATEGORY_LABEL_MAP)) {
      if (labelLower.includes(key) || key.includes(labelLower)) {
        if (label.score > bestMatch.confidence * 0.9) {
          bestMatch = {
            category: value.category,
            subcategory: value.subcategory,
            confidence: label.score * 0.9
          };
        }
      }
    }
  }
  
  return bestMatch;
}

// Helper: Assess quality from image properties
function assessQuality(
  _safeSearch: unknown,
  imageQuality: number
): { condition: 'new' | 'like_new' | 'good' | 'fair'; score: number } {
  // Base quality on image clarity/quality score
  // In a real implementation, you'd analyze for visible wear, stains, etc.
  
  if (imageQuality > 0.9) {
    return { condition: 'new', score: 0.9 };
  } else if (imageQuality > 0.75) {
    return { condition: 'like_new', score: 0.8 };
  } else if (imageQuality > 0.5) {
    return { condition: 'good', score: 0.7 };
  } else {
    return { condition: 'fair', score: 0.6 };
  }
}

// Main analysis function
export async function analyzeClothingImage(imageData: string): Promise<ClothingAnalysis> {
  const client = getVisionClient();
  
  // Remove data URL prefix if present
  let base64Data = imageData;
  if (imageData.startsWith('data:')) {
    const matches = imageData.match(/^data:[^;]+;base64,(.+)$/);
    if (matches) {
      base64Data = matches[1];
    }
  }
  
  // Convert to buffer
  const imageBuffer = Buffer.from(base64Data, 'base64');
  
  // Make Vision API request with multiple features
  const [result] = await client.annotateImage({
    image: { content: imageBuffer.toString('base64') },
    features: [
      { type: 'LABEL_DETECTION', maxResults: 20 },
      { type: 'IMAGE_PROPERTIES' },
      { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
      { type: 'SAFE_SEARCH_DETECTION' }
    ]
  });
  
  // STAGE 1: Category Detection
  const labels = (result.labelAnnotations || []).map((label: { description?: string | null; score?: number | null }) => ({
    description: label.description || '',
    score: label.score || 0
  }));
  
  const categoryResult = detectCategory(labels);
  
  // STAGE 2: Color Extraction
  const dominantColors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];
  const sortedColors = [...dominantColors].sort((a, b) => 
    (b.pixelFraction || 0) - (a.pixelFraction || 0)
  );
  
  let primaryColor = 'gray';
  let secondaryColor: string | undefined;
  
  if (sortedColors.length > 0 && sortedColors[0].color) {
    const c = sortedColors[0].color;
    primaryColor = findClosestColor(c.red || 0, c.green || 0, c.blue || 0);
  }
  
  if (sortedColors.length > 1 && sortedColors[1].color) {
    const c = sortedColors[1].color;
    const secondary = findClosestColor(c.red || 0, c.green || 0, c.blue || 0);
    if (secondary !== primaryColor) {
      secondaryColor = secondary;
    }
  }
  
  // Detect pattern
  const pattern = detectPattern(labels.map((l: { description: string }) => l.description));
  
  // STAGE 3: Quality Assessment
  // Calculate average label confidence as a proxy for image quality
  const avgConfidence = labels.length > 0
    ? labels.reduce((sum: number, l: { score: number }) => sum + l.score, 0) / labels.length
    : 0.7;
  
  const qualityResult = assessQuality(result.safeSearchAnnotation, avgConfidence);
  
  // Generate title and description
  const colorPrefix = primaryColor.charAt(0).toUpperCase() + primaryColor.slice(1);
  const subcategoryTitle = categoryResult.subcategory.charAt(0).toUpperCase() + 
    categoryResult.subcategory.slice(1);
  
  const suggestedTitle = `${colorPrefix} ${subcategoryTitle}`;
  const suggestedDescription = `${colorPrefix} ${categoryResult.subcategory} in ${qualityResult.condition} condition. ${pattern !== 'solid' ? `Features a ${pattern} pattern.` : 'Solid color.'}`;
  
  // Calculate overall confidence
  const confidence = (categoryResult.confidence + qualityResult.score) / 2;
  
  return {
    category: categoryResult.category,
    subcategory: categoryResult.subcategory,
    categoryConfidence: categoryResult.confidence,
    primaryColor,
    secondaryColor,
    pattern,
    condition: qualityResult.condition,
    qualityScore: qualityResult.score,
    suggestedTitle,
    suggestedDescription,
    allLabels: labels.map((l: { description: string }) => l.description),
    confidence
  };
}

// Check if Vision API is configured
export function isVisionConfigured(): boolean {
  return !!(process.env.GOOGLE_CLOUD_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS);
}
