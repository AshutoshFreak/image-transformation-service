/**
 * Image processing API routes.
 *
 * POST /  - Upload image, remove background, flip, and store in Cloudinary
 * DELETE /:id - Remove image from Cloudinary by public ID
 */
import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { removeBackground } from '../services/removeBg';
import { flipHorizontal } from '../services/imageProcessor';
import { uploadImage, deleteImage } from '../services/cloudinary';
import { ApiResponse, UploadResponse, DeleteResponse } from '../types';

const router = Router();

router.post(
  '/',
  upload.single('image'),
  async (
    req: Request,
    res: Response<ApiResponse<UploadResponse>>
  ): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No image file provided',
        });
        return;
      }

      const originalName = req.file.originalname;

      // Step 1: Remove background
      const bgRemovedBuffer = await removeBackground(req.file.buffer);

      // Step 2: Flip horizontally
      const flippedBuffer = await flipHorizontal(bgRemovedBuffer);

      // Step 3: Upload to Cloudinary
      const { url, publicId } = await uploadImage(flippedBuffer, originalName);

      res.status(201).json({
        success: true,
        data: {
          id: publicId,
          url,
          originalName,
        },
      });
    } catch (error) {
      console.error('Image processing error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to process image';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }
);

router.delete(
  '/:id',
  async (
    req: Request<{ id: string }>,
    res: Response<ApiResponse<DeleteResponse>>
  ): Promise<void> => {
    try {
      const id = decodeURIComponent(req.params.id);

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Image ID is required',
        });
        return;
      }

      await deleteImage(id);

      res.json({
        success: true,
        data: {
          message: 'Image deleted successfully',
        },
      });
    } catch (error) {
      console.error('Delete error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to delete image';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }
);

export default router;
