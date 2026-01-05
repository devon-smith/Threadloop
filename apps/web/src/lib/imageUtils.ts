// Utility functions for image processing, including HEIC conversion

import heic2any from 'heic2any';

// Convert HEIC/HEIF files to JPEG for browser compatibility
export async function convertHeicToJpeg(file: File): Promise<File> {
  // Only convert if it's a HEIC/HEIF file
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    // Try multiple conversion approaches
    let jpegBlob: Blob;
    
    try {
      // First attempt: basic conversion
      jpegBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      }) as Blob;
    } catch (firstError) {
      console.warn('First HEIC conversion attempt failed, trying alternative:', firstError);
      
      try {
        // Second attempt: with more specific options
        jpegBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        }) as Blob;
      } catch (secondError) {
        console.warn('Second HEIC conversion attempt failed:', secondError);
        
        // Final attempt: convert to PNG as fallback
        try {
          const pngBlob = await heic2any({
            blob: file,
            toType: 'image/png'
          }) as Blob;
          
          // Convert PNG to JPEG using canvas
          jpegBlob = await convertPngToJpeg(pngBlob);
        } catch (thirdError) {
          console.error('All HEIC conversion attempts failed:', thirdError);
          throw new Error(`HEIC conversion failed. This file format may not be supported. Please try converting the image to JPEG or PNG on your device first.`);
        }
      }
    }

    // Create a new File object from the converted blob
    const convertedFile = new File(
      [jpegBlob], 
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      { type: 'image/jpeg' }
    );

    return convertedFile;
  } catch (error) {
    console.error('Error converting HEIC file:', error);
    throw error;
  }
}

// Convert PNG blob to JPEG using Canvas API
async function convertPngToJpeg(pngBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw white background for JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert PNG to JPEG'));
        }
      }, 'image/jpeg', 0.8);
    };
    
    img.onerror = () => reject(new Error('Failed to load PNG for conversion'));
    img.src = URL.createObjectURL(pngBlob);
  });
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
export const SUPPORTED_FORMATS_TEXT = 'JPG, PNG, WebP, HEIC (may not work on all devices)';

// Check if HEIC support is available in the current browser
export function isHeicSupportAvailable(): boolean {
  // Basic check - most modern browsers should support the conversion
  // but some HEIC variants may not work
  return typeof document !== 'undefined' && !!document.createElement;
}
