import type { VercelRequest, VercelResponse } from '@vercel/node';
import convert from 'heic-convert';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { imageData, filename } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'No image data provided'
      });
    }

    // Extract base64 data from data URL if present
    let base64Data = imageData;
    let mimeType = 'image/heic';
    
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Use heic-convert to convert to JPEG (pure JavaScript, works on Vercel)
    const jpegBuffer = await convert({
      buffer: imageBuffer,
      format: 'JPEG',
      quality: 0.85
    });

    // Convert back to base64 data URL
    const jpegBase64 = `data:image/jpeg;base64,${Buffer.from(jpegBuffer).toString('base64')}`;

    // Generate new filename
    const newFilename = filename 
      ? filename.replace(/\.(heic|heif)$/i, '.jpg')
      : `converted-${Date.now()}.jpg`;

    return res.status(200).json({
      success: true,
      data: {
        imageData: jpegBase64,
        filename: newFilename,
        size: jpegBuffer.byteLength,
        originalMimeType: mimeType,
        convertedMimeType: 'image/jpeg'
      }
    });

  } catch (error) {
    console.error('Image conversion error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return res.status(500).json({
      success: false,
      error: 'Failed to convert image',
      details: errorMessage
    });
  }
}
