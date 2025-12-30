// Mock CLIP-style image feature extractor
// In production, this would use actual CLIP or similar vision model

export interface ImageFeatures {
  embedding: number[]; // 512-dimensional vector
  dominantColors: string[];
  detectedObjects: string[];
  textContent?: string[];
  confidence: number;
}

// Extract dominant colors from image data
function extractDominantColors(imageData: string): string[] {
  // In reality, this would analyze actual pixel data
  // For mock, we return plausible colors based on hash
  const hash = simpleHash(imageData);
  const colorPalettes = [
    ['black', 'white', 'gray'],
    ['navy', 'white', 'blue'],
    ['brown', 'beige', 'white'],
    ['black', 'gray', 'white'],
    ['blue', 'white', 'navy'],
    ['green', 'white', 'beige'],
    ['red', 'white', 'black'],
    ['pink', 'white', 'beige'],
    ['purple', 'white', 'gray'],
    ['yellow', 'white', 'beige']
  ];

  return colorPalettes[hash % colorPalettes.length];
}

// Detect objects/patterns in image
function detectObjects(imageData: string): string[] {
  // Mock object detection
  const hash = simpleHash(imageData);
  const objectSets = [
    ['clothing', 'upper-body', 'long-sleeves'],
    ['clothing', 'lower-body', 'pants'],
    ['clothing', 'dress', 'full-length'],
    ['clothing', 'outerwear', 'jacket'],
    ['footwear', 'sneakers', 'laces'],
    ['clothing', 'sweater', 'knit'],
    ['clothing', 'shirt', 'collar'],
    ['footwear', 'boots', 'heel']
  ];

  return objectSets[hash % objectSets.length];
}

// Generate mock CLIP embedding from image
function generateMockEmbedding(imageData: string, colors: string[], objects: string[]): number[] {
  const embedding = new Array(512).fill(0);

  // Use image data hash as seed
  const seed = simpleHash(imageData);

  // Encode detected objects into embedding space
  objects.forEach((obj, idx) => {
    const objHash = simpleHash(obj);
    const startIdx = (objHash % 20) * 20; // Distribute across embedding space
    for (let i = 0; i < 20; i++) {
      embedding[startIdx + i] = Math.sin((seed + idx) * 0.1 + i) * 0.3;
    }
  });

  // Encode colors
  colors.forEach((color, idx) => {
    const colorHash = simpleHash(color);
    const startIdx = 400 + (colorHash % 10) * 10;
    for (let i = 0; i < 10; i++) {
      embedding[startIdx + i] = Math.cos((seed + idx) * 0.15 + i) * 0.4;
    }
  });

  // Add base variation across remaining dimensions
  for (let i = 0; i < 512; i++) {
    if (embedding[i] === 0) {
      embedding[i] = (Math.sin(seed * 0.01 + i * 0.02) * 0.2);
    }
  }

  return embedding;
}

// Simple hash function for deterministic randomness
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 100); i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Main feature extraction function
export async function extractImageFeatures(imageData: string): Promise<ImageFeatures> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  const dominantColors = extractDominantColors(imageData);
  const detectedObjects = detectObjects(imageData);
  const embedding = generateMockEmbedding(imageData, dominantColors, detectedObjects);

  return {
    embedding,
    dominantColors,
    detectedObjects,
    confidence: 0.85 + Math.random() * 0.1 // Random confidence between 0.85-0.95
  };
}

// Extract features from image URL (for external images)
export async function extractImageFeaturesFromUrl(imageUrl: string): Promise<ImageFeatures> {
  // In production, this would fetch and process the image
  // For mock, we use URL as seed for deterministic features
  return extractImageFeatures(imageUrl);
}
