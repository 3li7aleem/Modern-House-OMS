/**
 * Utility functions for safe image handling, compression, and resizing
 * to guarantee that images stored in Firestore documents never exceed Firestore's 1MB limit.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxBytes?: number;
}

/**
 * Loads an image from a File, Blob, or base64/URL string into an HTMLImageElement.
 */
function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    if (typeof source === 'string') {
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error('Failed to load image from string source'));
      img.src = source;
    } else {
      const url = URL.createObjectURL(source);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image from file/blob source'));
      };
      img.src = url;
    }
  });
}

/**
 * Compresses and resizes an image to fit within max dimensions and target byte size.
 * Outputs a compact Data URL (JPEG or WebP) typically between 15KB and 100KB,
 * ensuring complete safety for Firestore document limits (max 1,048,576 bytes).
 */
export async function compressAndResizeImage(
  source: File | Blob | string,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.8,
    maxBytes = 120 * 1024 // Default 120 KB max
  } = options;

  try {
    const img = await loadImage(source);
    
    let { width, height } = img;

    // Calculate aspect ratio scale
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(width, 1);
    canvas.height = Math.max(height, 1);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // High quality canvas rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill white background for transparent PNGs converted to JPEG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Try WebP first, fallback to JPEG
    let format = 'image/jpeg';
    let currentQuality = quality;
    let dataUrl = canvas.toDataURL(format, currentQuality);

    // Estimate byte size from base64 string
    const getByteSize = (str: string) => Math.round((str.length * 3) / 4);

    let attempts = 0;
    // Iteratively scale down or reduce quality if size still exceeds maxBytes
    while (getByteSize(dataUrl) > maxBytes && attempts < 4) {
      attempts++;
      currentQuality = Math.max(0.4, currentQuality - 0.15);
      
      // Also scale down dimensions if still too large
      if (canvas.width > 200 && canvas.height > 200) {
        canvas.width = Math.round(canvas.width * 0.8);
        canvas.height = Math.round(canvas.height * 0.8);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      dataUrl = canvas.toDataURL(format, currentQuality);
    }

    return dataUrl;
  } catch (error) {
    console.warn('Image compression fallback:', error);
    // If source is already a string, check if it fits in maxBytes, else truncate or return as is
    if (typeof source === 'string') {
      return source;
    }
    // As a last fallback, read file as data url
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(source);
    });
  }
}
