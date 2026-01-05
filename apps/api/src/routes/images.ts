import { Router, Request, Response } from 'express';
import sharp from 'sharp';

const router = Router();

// Convert HEIC/HEIF images to JPEG
router.post('/convert', async (req: Request, res: Response) => {
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

    // Use sharp to convert to JPEG
    // Sharp automatically detects HEIC/HEIF and other formats
    const jpegBuffer = await sharp(imageBuffer)
      .jpeg({
        quality: 85,
        mozjpeg: true // Better compression
      })
      .toBuffer();

    // Get image metadata for response
    const metadata = await sharp(jpegBuffer).metadata();

    // Convert back to base64 data URL
    const jpegBase64 = `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`;

    // Generate new filename
    const newFilename = filename 
      ? filename.replace(/\.(heic|heif)$/i, '.jpg')
      : `converted-${Date.now()}.jpg`;

    res.json({
      success: true,
      data: {
        imageData: jpegBase64,
        filename: newFilename,
        width: metadata.width,
        height: metadata.height,
        size: jpegBuffer.length,
        originalMimeType: mimeType,
        convertedMimeType: 'image/jpeg'
      }
    });

  } catch (error) {
    console.error('Image conversion error:', error);
    
    // Provide helpful error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(500).json({
      success: false,
      error: 'Failed to convert image',
      details: errorMessage.includes('heif') || errorMessage.includes('Input buffer')
        ? 'The image format could not be processed. Please try a different image.'
        : errorMessage
    });
  }
});

// Health check for image service
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'image-conversion',
    supportedFormats: ['heic', 'heif', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff'],
    outputFormat: 'jpeg'
  });
});

export default router;
