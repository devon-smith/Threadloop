import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  
  if (!apiKey) {
    return res.status(200).json({
      success: true,
      visionEnabled: false,
      reason: 'GOOGLE_CLOUD_API_KEY not set',
      keyLength: 0
    });
  }

  // Test the API key with a simple request
  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { 
              source: { imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/300px-PNG_transparency_demonstration_1.png' }
            },
            features: [{ type: 'LABEL_DETECTION', maxResults: 1 }]
          }]
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(200).json({
        success: true,
        visionEnabled: false,
        reason: 'API key test failed',
        error: data.error?.message || 'Unknown error',
        status: response.status,
        keyPrefix: apiKey.substring(0, 10) + '...'
      });
    }

    return res.status(200).json({
      success: true,
      visionEnabled: true,
      reason: 'Vision API working',
      testLabels: data.responses?.[0]?.labelAnnotations?.map((l: { description: string }) => l.description) || [],
      keyPrefix: apiKey.substring(0, 10) + '...'
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      visionEnabled: false,
      reason: 'API test error',
      error: error instanceof Error ? error.message : 'Unknown error',
      keyPrefix: apiKey.substring(0, 10) + '...'
    });
  }
}
