// Utility functions for image processing
// Note: HEIC conversion is not reliably supported in browsers due to codec limitations

// Check if a file is a HEIC/HEIF image
export function isHeicFile(file: File): boolean {
  return file.type.includes('heic') || file.type.includes('heif') || 
         file.name.toLowerCase().endsWith('.heic') || 
         file.name.toLowerCase().endsWith('.heif');
}

// Create a preview URL - returns error for unsupported HEIC files
export async function createImagePreview(file: File): Promise<string> {
  // Check if it's a HEIC file - these are not supported in browsers
  if (isHeicFile(file)) {
    throw new Error(
      'HEIC images are not supported by web browsers. ' +
      'Please convert your image to JPEG or PNG first.\n\n' +
      'On iPhone: Go to Settings → Camera → Formats → Select "Most Compatible"\n' +
      'Or use the Files app to convert: Open image → Share → Save to Files (it auto-converts)'
    );
  }

  // For supported formats, create object URL directly
  return URL.createObjectURL(file);
}

// Placeholder for convertHeicToJpeg - throws helpful error
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (isHeicFile(file)) {
    throw new Error(
      'HEIC conversion is not supported in web browsers. ' +
      'Please convert your image to JPEG or PNG on your device first.'
    );
  }
  return file;
}

// Get supported image types for file input (excluding HEIC)
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
];

// Get human-readable list of supported formats
export const SUPPORTED_FORMATS_TEXT = 'JPG, PNG, WebP, or GIF';

// Validate if a file is a supported image type
export function isSupportedImageType(file: File): boolean {
  return SUPPORTED_IMAGE_TYPES.some(type => 
    file.type === type || file.type.includes(type.split('/')[1])
  );
}
