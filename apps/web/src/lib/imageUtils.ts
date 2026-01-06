// Utility functions for image processing
// HEIC conversion is handled server-side using sharp library

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? `${window.location.origin}/api` : 'http://localhost:4000');

// Check if a file is a HEIC/HEIF image
export function isHeicFile(file: File): boolean {
  return file.type.includes('heic') || file.type.includes('heif') || 
         file.name.toLowerCase().endsWith('.heic') || 
         file.name.toLowerCase().endsWith('.heif');
}

// Convert HEIC file to JPEG using server-side conversion
export async function convertHeicToJpeg(file: File): Promise<{ dataUrl: string; filename: string }> {
  // Read file as base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Call API to convert
  const response = await fetch(`${API_BASE_URL}/images/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageData: base64Data,
      filename: file.name
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Conversion failed' }));
    throw new Error(error.error || 'Failed to convert HEIC image');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to convert HEIC image');
  }

  return {
    dataUrl: result.data.imageData,
    filename: result.data.filename
  };
}

// Create a preview URL - handles HEIC via server-side conversion
export async function createImagePreview(file: File): Promise<string> {
  // For HEIC files, use server-side conversion
  if (isHeicFile(file)) {
    try {
      const { dataUrl } = await convertHeicToJpeg(file);
      return dataUrl;
    } catch (error) {
      console.error('HEIC conversion failed:', error);
      throw new Error(
        'Failed to convert HEIC image. Please try converting to JPG on your device first.\n\n' +
        'On iPhone: Settings → Camera → Formats → "Most Compatible"'
      );
    }
  }

  // For supported formats, convert to base64 data URL
  // (blob URLs are session-local and can't be uploaded to storage)
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Get supported image types for file input (including HEIC now)
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif'
];

// Get human-readable list of supported formats
export const SUPPORTED_FORMATS_TEXT = 'JPG, PNG, WebP, GIF, or HEIC';

// Validate if a file is a supported image type
export function isSupportedImageType(file: File): boolean {
  return SUPPORTED_IMAGE_TYPES.some(type => 
    file.type === type || file.type.includes(type.split('/')[1])
  ) || isHeicFile(file);
}
