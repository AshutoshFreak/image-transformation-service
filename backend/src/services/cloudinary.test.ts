import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { initCloudinary, uploadImage, deleteImage } from './cloudinary';

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

// Mock Readable.from to track pipe calls
const mockPipe = jest.fn();
jest.mock('stream', () => {
  const actualStream = jest.requireActual('stream');
  return {
    ...actualStream,
    Readable: {
      ...actualStream.Readable,
      from: jest.fn(() => ({
        pipe: mockPipe,
      })),
    },
  };
});

describe('cloudinary service', () => {
  const originalEnv = process.env;
  const mockBuffer = Buffer.from('test-image-data');

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-api-key';
    process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
    jest.clearAllMocks();
    mockPipe.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('initCloudinary', () => {
    it('should initialize cloudinary with valid credentials', () => {
      initCloudinary();

      expect(cloudinary.config).toHaveBeenCalledWith({
        cloud_name: 'test-cloud',
        api_key: 'test-api-key',
        api_secret: 'test-api-secret',
      });
    });

    it('should throw error when CLOUDINARY_CLOUD_NAME is missing', () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;

      expect(() => initCloudinary()).toThrow(
        'Cloudinary credentials are not configured'
      );
    });

    it('should throw error when CLOUDINARY_API_KEY is missing', () => {
      delete process.env.CLOUDINARY_API_KEY;

      expect(() => initCloudinary()).toThrow(
        'Cloudinary credentials are not configured'
      );
    });

    it('should throw error when CLOUDINARY_API_SECRET is missing', () => {
      delete process.env.CLOUDINARY_API_SECRET;

      expect(() => initCloudinary()).toThrow(
        'Cloudinary credentials are not configured'
      );
    });

    it('should throw error when all credentials are missing', () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;

      expect(() => initCloudinary()).toThrow(
        'Cloudinary credentials are not configured'
      );
    });

    it('should throw error when credentials are empty strings', () => {
      process.env.CLOUDINARY_CLOUD_NAME = '';
      process.env.CLOUDINARY_API_KEY = 'test-key';
      process.env.CLOUDINARY_API_SECRET = 'test-secret';

      expect(() => initCloudinary()).toThrow(
        'Cloudinary credentials are not configured'
      );
    });
  });

  describe('uploadImage', () => {
    it('should successfully upload an image', async () => {
      const mockResult = {
        secure_url: 'https://cloudinary.com/image.png',
        public_id: 'image-transformation/processed_123_test',
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          // Simulate successful upload by calling the callback
          setTimeout(() => callback(null, mockResult), 0);
          return { on: jest.fn() };
        }
      );

      const result = await uploadImage(mockBuffer, 'test-image.png');

      expect(result).toEqual({
        url: 'https://cloudinary.com/image.png',
        publicId: 'image-transformation/processed_123_test',
      });
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'image-transformation',
          resource_type: 'image',
        }),
        expect.any(Function)
      );
    });

    it('should strip file extension from public_id', async () => {
      const mockResult = {
        secure_url: 'https://cloudinary.com/image.png',
        public_id: 'image-transformation/processed_123_myimage',
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          // Verify the public_id doesn't contain extension
          expect(options.public_id).toMatch(/^processed_\d+_myimage$/);
          setTimeout(() => callback(null, mockResult), 0);
          return { on: jest.fn() };
        }
      );

      await uploadImage(mockBuffer, 'myimage.jpg');
    });

    it('should handle filenames with multiple dots', async () => {
      const mockResult = {
        secure_url: 'https://cloudinary.com/image.png',
        public_id: 'image-transformation/processed_123_my.image.name',
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          // Should only remove the last extension
          expect(options.public_id).toMatch(/^processed_\d+_my\.image\.name$/);
          setTimeout(() => callback(null, mockResult), 0);
          return { on: jest.fn() };
        }
      );

      await uploadImage(mockBuffer, 'my.image.name.png');
    });

    it('should reject when upload returns an error', async () => {
      const mockError = new Error('Upload failed');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          setTimeout(() => callback(mockError, null), 0);
          return { on: jest.fn() };
        }
      );

      await expect(uploadImage(mockBuffer, 'test.png')).rejects.toThrow(
        'Upload failed'
      );
    });

    it('should reject when upload returns no result', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          setTimeout(() => callback(null, null), 0);
          return { on: jest.fn() };
        }
      );

      await expect(uploadImage(mockBuffer, 'test.png')).rejects.toThrow(
        'Upload failed with no result'
      );
    });

    it('should reject when upload returns undefined result', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          setTimeout(() => callback(null, undefined), 0);
          return { on: jest.fn() };
        }
      );

      await expect(uploadImage(mockBuffer, 'test.png')).rejects.toThrow(
        'Upload failed with no result'
      );
    });

    it('should use Readable.from to create stream from buffer', async () => {
      const mockResult = {
        secure_url: 'https://cloudinary.com/image.png',
        public_id: 'test-id',
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          setTimeout(() => callback(null, mockResult), 0);
          return { on: jest.fn() };
        }
      );

      await uploadImage(mockBuffer, 'test.png');

      expect(Readable.from).toHaveBeenCalledWith(mockBuffer);
      expect(mockPipe).toHaveBeenCalled();
    });

    it('should handle cloudinary network errors', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          setTimeout(() => callback(new Error('Network timeout'), null), 0);
          return { on: jest.fn() };
        }
      );

      await expect(uploadImage(mockBuffer, 'test.png')).rejects.toThrow(
        'Network timeout'
      );
    });
  });

  describe('deleteImage', () => {
    it('should successfully delete an image', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      await deleteImage('image-transformation/test-image');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'image-transformation/test-image'
      );
    });

    it('should handle delete of non-existent image', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'not found',
      });

      // Should not throw - Cloudinary returns 'not found' but doesn't error
      await expect(
        deleteImage('non-existent-id')
      ).resolves.toBeUndefined();
    });

    it('should throw error when delete fails', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(
        new Error('Delete failed')
      );

      await expect(deleteImage('test-id')).rejects.toThrow('Delete failed');
    });

    it('should handle special characters in public_id', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      await deleteImage('folder/sub-folder/image_123');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'folder/sub-folder/image_123'
      );
    });

    it('should handle URL-encoded public_id', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      await deleteImage('folder%2Fimage');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('folder%2Fimage');
    });
  });
});
