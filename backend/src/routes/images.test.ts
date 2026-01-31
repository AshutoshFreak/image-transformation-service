import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';

// Create mocks for services
const mockRemoveBackground = jest.fn();
const mockFlipHorizontal = jest.fn();
const mockUploadImage = jest.fn();
const mockDeleteImage = jest.fn();

// Mock all external services before importing
jest.mock('../services/removeBg', () => ({
  removeBackground: (...args: unknown[]) => mockRemoveBackground(...args),
}));

jest.mock('../services/imageProcessor', () => ({
  flipHorizontal: (...args: unknown[]) => mockFlipHorizontal(...args),
}));

jest.mock('../services/cloudinary', () => ({
  uploadImage: (...args: unknown[]) => mockUploadImage(...args),
  deleteImage: (...args: unknown[]) => mockDeleteImage(...args),
}));

// Mock multer
jest.mock('../middleware/upload', () => {
  const multer = require('multer');
  const storage = multer.memoryStorage();
  return {
    upload: multer({ storage }),
  };
});

import imageRoutes from './images';

describe('Image Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/images', imageRoutes);

    // Add error handler for multer errors
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      res.status(400).json({ success: false, error: err.message });
    });

    jest.clearAllMocks();
  });

  describe('POST /api/images', () => {
    const mockImageBuffer = Buffer.from('test-image-data');
    const mockBgRemovedBuffer = Buffer.from('bg-removed');
    const mockFlippedBuffer = Buffer.from('flipped');

    it('should successfully process and upload an image', async () => {
      mockRemoveBackground.mockResolvedValue(mockBgRemovedBuffer);
      mockFlipHorizontal.mockResolvedValue(mockFlippedBuffer);
      mockUploadImage.mockResolvedValue({
        url: 'https://cloudinary.com/processed-image.png',
        publicId: 'image-transformation/processed_123_test-image',
      });

      const response = await request(app)
        .post('/api/images')
        .attach('image', mockImageBuffer, {
          filename: 'test-image.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          id: 'image-transformation/processed_123_test-image',
          url: 'https://cloudinary.com/processed-image.png',
          originalName: 'test-image.png',
        },
      });

      expect(mockRemoveBackground).toHaveBeenCalledWith(expect.any(Buffer));
      expect(mockFlipHorizontal).toHaveBeenCalledWith(mockBgRemovedBuffer);
      expect(mockUploadImage).toHaveBeenCalledWith(mockFlippedBuffer, 'test-image.png');
    });

    it('should return 400 when no file is provided', async () => {
      const response = await request(app)
        .post('/api/images')
        .send();

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'No image file provided',
      });
    });

    it('should return 500 when background removal fails', async () => {
      mockRemoveBackground.mockRejectedValue(new Error('Background removal API error'));

      const response = await request(app)
        .post('/api/images')
        .attach('image', mockImageBuffer, {
          filename: 'test.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Background removal API error',
      });
    });

    it('should return 500 when image processing fails', async () => {
      mockRemoveBackground.mockResolvedValue(mockBgRemovedBuffer);
      mockFlipHorizontal.mockRejectedValue(new Error('Image processing failed'));

      const response = await request(app)
        .post('/api/images')
        .attach('image', mockImageBuffer, {
          filename: 'test.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Image processing failed',
      });
    });

    it('should return 500 when cloudinary upload fails', async () => {
      mockRemoveBackground.mockResolvedValue(mockBgRemovedBuffer);
      mockFlipHorizontal.mockResolvedValue(mockFlippedBuffer);
      mockUploadImage.mockRejectedValue(new Error('Cloudinary upload failed'));

      const response = await request(app)
        .post('/api/images')
        .attach('image', mockImageBuffer, {
          filename: 'test.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Cloudinary upload failed',
      });
    });

    it('should handle non-Error exceptions with default message', async () => {
      mockRemoveBackground.mockRejectedValue('string error');

      const response = await request(app)
        .post('/api/images')
        .attach('image', mockImageBuffer, {
          filename: 'test.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Failed to process image',
      });
    });

    it('should process JPEG images', async () => {
      mockRemoveBackground.mockResolvedValue(mockBgRemovedBuffer);
      mockFlipHorizontal.mockResolvedValue(mockFlippedBuffer);
      mockUploadImage.mockResolvedValue({
        url: 'https://cloudinary.com/image.png',
        publicId: 'image-transformation/processed_123_photo',
      });

      const response = await request(app)
        .post('/api/images')
        .attach('image', mockImageBuffer, {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.originalName).toBe('photo.jpg');
    });

    it('should process WebP images', async () => {
      mockRemoveBackground.mockResolvedValue(mockBgRemovedBuffer);
      mockFlipHorizontal.mockResolvedValue(mockFlippedBuffer);
      mockUploadImage.mockResolvedValue({
        url: 'https://cloudinary.com/image.png',
        publicId: 'image-transformation/processed_123_photo',
      });

      const response = await request(app)
        .post('/api/images')
        .attach('image', mockImageBuffer, {
          filename: 'photo.webp',
          contentType: 'image/webp',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.originalName).toBe('photo.webp');
    });

    it('should handle API key missing error from removeBg', async () => {
      mockRemoveBackground.mockRejectedValue(new Error('CLIPDROP_API_KEY is not configured'));

      const response = await request(app)
        .post('/api/images')
        .attach('image', mockImageBuffer, {
          filename: 'test.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('CLIPDROP_API_KEY is not configured');
    });

    it('should handle rate limit error from removeBg', async () => {
      mockRemoveBackground.mockRejectedValue(new Error('Rate limit exceeded'));

      const response = await request(app)
        .post('/api/images')
        .attach('image', mockImageBuffer, {
          filename: 'test.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Rate limit exceeded');
    });
  });

  describe('DELETE /api/images/:id', () => {
    it('should successfully delete an image', async () => {
      mockDeleteImage.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/images/image-transformation%2Ftest-image');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          message: 'Image deleted successfully',
        },
      });
      expect(mockDeleteImage).toHaveBeenCalledWith('image-transformation/test-image');
    });

    it('should decode URL-encoded image ID', async () => {
      mockDeleteImage.mockResolvedValue(undefined);

      await request(app)
        .delete('/api/images/folder%2Fsubfolder%2Fimage_123');

      expect(mockDeleteImage).toHaveBeenCalledWith('folder/subfolder/image_123');
    });

    it('should handle image ID with special characters', async () => {
      mockDeleteImage.mockResolvedValue(undefined);

      await request(app)
        .delete('/api/images/processed_1234567890_my-image');

      expect(mockDeleteImage).toHaveBeenCalledWith('processed_1234567890_my-image');
    });

    it('should return 500 when cloudinary delete fails', async () => {
      mockDeleteImage.mockRejectedValue(new Error('Cloudinary delete failed'));

      const response = await request(app)
        .delete('/api/images/test-image-id');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Cloudinary delete failed',
      });
    });

    it('should handle non-Error exceptions with default message', async () => {
      mockDeleteImage.mockRejectedValue('string error');

      const response = await request(app)
        .delete('/api/images/test-image-id');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Failed to delete image',
      });
    });

    it('should handle network errors during delete', async () => {
      mockDeleteImage.mockRejectedValue(new Error('Network timeout'));

      const response = await request(app)
        .delete('/api/images/test-image');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Network timeout',
      });
    });

    it('should handle image not found in cloudinary', async () => {
      mockDeleteImage.mockRejectedValue(new Error('Resource not found'));

      const response = await request(app)
        .delete('/api/images/non-existent-image');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Resource not found');
    });

    it('should handle double URL-encoded paths', async () => {
      mockDeleteImage.mockResolvedValue(undefined);

      // Express decodes URL params, then decodeURIComponent decodes again
      // So %252F -> %2F (by Express) -> / (by decodeURIComponent)
      await request(app)
        .delete('/api/images/image-transformation%252Ftest');

      expect(mockDeleteImage).toHaveBeenCalledWith('image-transformation/test');
    });
  });
});
