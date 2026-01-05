import type { VercelRequest, VercelResponse } from '@vercel/node';

// Category mappings from Vision API labels
const CATEGORY_LABEL_MAP: Record<string, { category: string; subcategory: string }> = {
  't-shirt': { category: 'Tops', subcategory: 't-shirt' },
  'shirt': { category: 'Tops', subcategory: 'shirt' },
  'blouse': { category: 'Tops', subcategory: 'blouse' },
  'polo shirt': { category: 'Tops', subcategory: 'polo' },
  'tank top': { category: 'Tops', subcategory: 'tank top' },
  'top': { category: 'Tops', subcategory: 'top' },
  'jeans': { category: 'Bottoms', subcategory: 'jeans' },
  'pants': { category: 'Bottoms', subcategory: 'pants' },
  'trousers': { category: 'Bottoms', subcategory: 'pants' },
  'shorts': { category: 'Bottoms', subcategory: 'shorts' },
  'skirt': { category: 'Bottoms', subcategory: 'skirt' },
  'dress': { category: 'Dresses', subcategory: 'dress' },
  'gown': { category: 'Dresses', subcategory: 'gown' },
  'jacket': { category: 'Outerwear', subcategory: 'jacket' },
  'coat': { category: 'Outerwear', subcategory: 'coat' },
  'blazer': { category: 'Outerwear', subcategory: 'blazer' },
  'hoodie': { category: 'Outerwear', subcategory: 'hoodie' },
  'cardigan': { category: 'Outerwear', subcategory: 'cardigan' },
  'sweater': { category: 'Outerwear', subcategory: 'sweater' },
  'outerwear': { category: 'Outerwear', subcategory: 'jacket' },
  'shoe': { category: 'Footwear', subcategory: 'shoes' },
  'shoes': { category: 'Footwear', subcategory: 'shoes' },
  'sneakers': { category: 'Footwear', subcategory: 'sneakers' },
  'boots': { category: 'Footwear', subcategory: 'boots' },
  'hat': { category: 'Accessories', subcategory: 'hat' },
  'bag': { category: 'Accessories', subcategory: 'bag' },
  'backpack': { category: 'Accessories', subcategory: 'backpack' },
};

// Color name mapping
const COLOR_NAMES = [
  { name: 'black', r: 0, g: 0, b: 0 },
  { name: 'white', r: 255, g: 255, b: 255 },
  { name: 'gray', r: 128, g: 128, b: 128 },
  { name: 'red', r: 255, g: 0, b: 0 },
  { name: 'pink', r: 255, g: 192, b: 203 },
  { name: 'orange', r: 255, g: 165, b: 0 },
  { name: 'yellow', r: 255, g: 255, b: 0 },
  { name: 'green', r: 0, g: 128, b: 0 },
  { name: 'blue', r: 0, g: 0, b: 255 },
  { name: 'navy', r: 0, g: 0, b: 128 },
  { name: 'purple', r: 128, g: 0, b: 128 },
  { name: 'brown', r: 139, g: 69, b: 19 },
  { name: 'beige', r: 245, g: 245, b: 220 },
];

function findClosestColor(r: number, g: number, b: number): string {
  let closestColor = 'gray';
  let minDistance = Infinity;
  for (const color of COLOR_NAMES) {
    const distance = Math.sqrt(
      Math.pow(r - color.r, 2) + Math.pow(g - color.g, 2) + Math.pow(b - color.b, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color.name;
    }
  }
  return closestColor;
}

function detectCategory(labels: Array<{ description: string; score: number }>) {
  let bestMatch = { category: 'Other', subcategory: 'item', confidence: 0.5 };
  for (const label of labels) {
    const labelLower = label.description.toLowerCase();
    if (CATEGORY_LABEL_MAP[labelLower] && label.score > bestMatch.confidence) {
      bestMatch = { ...CATEGORY_LABEL_MAP[labelLower], confidence: label.score };
    }
    for (const [key, value] of Object.entries(CATEGORY_LABEL_MAP)) {
      if ((labelLower.includes(key) || key.includes(labelLower)) && label.score > bestMatch.confidence * 0.9) {
        bestMatch = { ...value, confidence: label.score * 0.9 };
      }
    }
  }
  return bestMatch;
}

// Use REST API directly instead of client library (works better on serverless)
async function callVisionAPI(apiKey: string, base64Image: string) {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64Image },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 20 },
            { type: 'IMAGE_PROPERTIES' }
          ]
        }]
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vision API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.responses?.[0] || {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { imageData, category: hintCategory, size: hintSize } = req.body || {};

  if (!imageData) {
    return res.status(400).json({ success: false, error: 'Provide imageData' });
  }

  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      success: true,
      data: {
        title: 'Clothing Item',
        description: 'Great condition item. Meet up on campus to exchange.',
        category: hintCategory || 'Tops',
        size: hintSize || 'M',
        condition: 'good',
        price: 25,
        aiMetadata: { source: 'fallback-no-api-key', confidence: 0.5 }
      }
    });
  }

  try {
    // Extract base64 from data URL
    let base64Data = imageData;
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:[^;]+;base64,(.+)$/);
      if (matches) base64Data = matches[1];
    }

    const result = await callVisionAPI(apiKey, base64Data);

    // Process labels
    const labels = (result.labelAnnotations || []).map((l: { description?: string; score?: number }) => ({
      description: l.description || '',
      score: l.score || 0
    }));
    const categoryResult = detectCategory(labels);

    // Process colors
    const dominantColors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];
    const sortedColors = [...dominantColors].sort((a: { pixelFraction?: number }, b: { pixelFraction?: number }) => 
      (b.pixelFraction || 0) - (a.pixelFraction || 0)
    );
    let primaryColor = 'gray';
    if (sortedColors.length > 0 && sortedColors[0].color) {
      const c = sortedColors[0].color;
      primaryColor = findClosestColor(c.red || 0, c.green || 0, c.blue || 0);
    }

    // Build response
    const category = hintCategory || categoryResult.category;
    const subcategory = categoryResult.subcategory;
    const colorTitle = primaryColor.charAt(0).toUpperCase() + primaryColor.slice(1);
    const subTitle = subcategory.charAt(0).toUpperCase() + subcategory.slice(1);
    const title = `${colorTitle} ${subTitle}`;
    const condition = categoryResult.confidence > 0.8 ? 'like_new' : 'good';

    return res.status(200).json({
      success: true,
      data: {
        title,
        description: `${colorTitle} ${subcategory} in ${condition} condition. Great for campus swaps.`,
        category,
        subcategory,
        size: hintSize || 'M',
        condition,
        price: category === 'Outerwear' ? 45 : category === 'Footwear' ? 35 : 25,
        aiMetadata: {
          primaryColor,
          labels: labels.slice(0, 10).map((l: { description: string }) => l.description),
          confidence: categoryResult.confidence,
          source: 'google-vision'
        }
      }
    });
  } catch (error) {
    console.error('Vision API error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(200).json({
      success: true,
      data: {
        title: 'Clothing Item',
        description: 'Great condition item for campus swaps.',
        category: hintCategory || 'Tops',
        size: hintSize || 'M',
        condition: 'good',
        price: 25,
        aiMetadata: { source: 'fallback-error', error: errorMsg, confidence: 0.5 }
      }
    });
  }
}
