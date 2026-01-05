// Utility functions for image processing, including HEIC conversion

import heic2any from 'heic2any';

// Convert HEIC/HEIF files to JPEG for browser compatibility
export async function convertHeicToJpeg(file: File): Promise<File> {
  // Only convert if it's a HEIC/HEIF file
  if (!file.type.includes('heic') && !file.type.includes('heif')) {
    return file;
  }

  try {
    // Convert HEIC to JPEG blob
    const jpegBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8
    });

    // Create a new File object from the converted blob
    const convertedFile = new File(
      [jpegBlob as Blob], 
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      { type: 'image/jpeg' }
    );

    return convertedFile;
  } catch (error) {
    console.error('Error converting HEIC file:', error);
    throw new Error('Failed to convert HEIC image. Please try a JPEG or PNG file.');
  }
}

// Create a preview URL that works for all image types
export async function createImagePreview(file: File): Promise<string> {
  try {
    // Convert HEIC files first
    const processedFile = await convertHeicToJpeg(file);
    return URL.createObjectURL(processedFile);
  } catch (error) {
    console.error('Error creating image preview:', error);
    throw error;
  }
}

// Check if a file is a HEIC/HEIF image
export function isHeicFile(file: File): boolean {
  return file.type.includes('heic') || file.type.includes('heif') || 
         file.name.toLowerCase().endsWith('.heic') || 
         file.name.toLowerCase().endsWith('.heif');
}

// Get supported image types for file input
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
];

// Get human-readable list of supported formats
export const SUPPORTED_FORMATS_TEXT = 'JPG, PNG, WebP, HEIC';
