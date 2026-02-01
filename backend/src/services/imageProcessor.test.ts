import sharp from 'sharp';
import { flipHorizontal } from './imageProcessor';

// Mock sharp
jest.mock('sharp');

describe('imageProcessor service', () => {
  const mockBuffer = Buffer.from('test-image-data');
  const mockOutputBuffer = Buffer.from('flipped-image-data');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('flipHorizontal', () => {
    it('should flip image horizontally and return PNG buffer', async () => {
      const mockSharpInstance = {
        flop: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(mockOutputBuffer),
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharpInstance);

      const result = await flipHorizontal(mockBuffer);

      expect(sharp).toHaveBeenCalledWith(mockBuffer);
      expect(mockSharpInstance.flop).toHaveBeenCalled();
      expect(mockSharpInstance.png).toHaveBeenCalled();
      expect(mockSharpInstance.toBuffer).toHaveBeenCalled();
      expect(result).toBe(mockOutputBuffer);
    });

    it('should handle empty buffer input', async () => {
      const emptyBuffer = Buffer.from('');
      const mockSharpInstance = {
        flop: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('')),
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharpInstance);

      const result = await flipHorizontal(emptyBuffer);

      expect(sharp).toHaveBeenCalledWith(emptyBuffer);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should throw error when sharp fails to process image', async () => {
      const mockSharpInstance = {
        flop: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(new Error('Invalid image data')),
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharpInstance);

      await expect(flipHorizontal(mockBuffer)).rejects.toThrow('Invalid image data');
    });

    it('should throw error when sharp constructor fails', async () => {
      (sharp as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('Input buffer contains unsupported image format');
      });

      await expect(flipHorizontal(mockBuffer)).rejects.toThrow(
        'Input buffer contains unsupported image format'
      );
    });

    it('should handle large image buffers', async () => {
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB buffer
      const mockSharpInstance = {
        flop: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(mockOutputBuffer),
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharpInstance);

      const result = await flipHorizontal(largeBuffer);

      expect(sharp).toHaveBeenCalledWith(largeBuffer);
      expect(result).toBe(mockOutputBuffer);
    });

    it('should chain flop and png methods correctly', async () => {
      const callOrder: string[] = [];
      const mockSharpInstance = {
        flop: jest.fn().mockImplementation(() => {
          callOrder.push('flop');
          return mockSharpInstance;
        }),
        png: jest.fn().mockImplementation(() => {
          callOrder.push('png');
          return mockSharpInstance;
        }),
        toBuffer: jest.fn().mockImplementation(() => {
          callOrder.push('toBuffer');
          return Promise.resolve(mockOutputBuffer);
        }),
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharpInstance);

      await flipHorizontal(mockBuffer);

      // Verify the chain order
      expect(callOrder).toEqual(['flop', 'png', 'toBuffer']);
    });
  });
});
