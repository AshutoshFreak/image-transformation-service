/**
 * Cloudinary integration for image storage and CDN delivery.
 */
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

/**
 * Initialize Cloudinary with credentials from environment variables.
 * Must be called before any upload/delete operations.
 * @throws Error if credentials are missing
 */
export function initCloudinary(): void {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials are not configured');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

/**
 * Upload a processed image to Cloudinary.
 * @param imageBuffer - The image data as a Buffer
 * @param filename - Original filename (used to generate public ID)
 * @returns Object with CDN URL and public ID for future reference/deletion
 */
export async function uploadImage(
  imageBuffer: Buffer,
  filename: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'image-transformation',
        public_id: `processed_${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}`,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } else {
          reject(new Error('Upload failed with no result'));
        }
      }
    );

    const readableStream = Readable.from(imageBuffer);
    readableStream.pipe(uploadStream);
  });
}

/**
 * Delete an image from Cloudinary and invalidate CDN cache.
 * @param publicId - The Cloudinary public ID of the image
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { invalidate: true });
}
