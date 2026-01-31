import axios from 'axios';
import { removeBackground } from './removeBg';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('removeBg service', () => {
  const originalEnv = process.env;
  const mockImageBuffer = Buffer.from('test-image-data');
  const mockResponseBuffer = Buffer.from('processed-image-data');

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.CLIPDROP_API_KEY = 'test-api-key';
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('removeBackground', () => {
    it('should successfully remove background from an image', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: mockResponseBuffer,
      });

      const result = await removeBackground(mockImageBuffer);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://clipdrop-api.co/remove-background/v1',
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'x-api-key': 'test-api-key',
          },
          responseType: 'arraybuffer',
          validateStatus: expect.any(Function),
        })
      );
    });

    it('should throw error when CLIPDROP_API_KEY is not configured', async () => {
      delete process.env.CLIPDROP_API_KEY;

      await expect(removeBackground(mockImageBuffer)).rejects.toThrow(
        'CLIPDROP_API_KEY is not configured'
      );
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should throw error with API error message when request fails with JSON error', async () => {
      const errorResponse = JSON.stringify({ error: 'Invalid image format' });
      mockedAxios.post.mockResolvedValue({
        status: 400,
        data: Buffer.from(errorResponse),
      });

      await expect(removeBackground(mockImageBuffer)).rejects.toThrow(
        'Invalid image format'
      );
    });

    it('should throw default error message when API fails with non-JSON response', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 400,
        data: Buffer.from('plain text error'),
      });

      await expect(removeBackground(mockImageBuffer)).rejects.toThrow(
        'Background removal failed'
      );
    });

    it('should throw error when API returns 401 unauthorized', async () => {
      const errorResponse = JSON.stringify({ error: 'Invalid API key' });
      mockedAxios.post.mockResolvedValue({
        status: 401,
        data: Buffer.from(errorResponse),
      });

      await expect(removeBackground(mockImageBuffer)).rejects.toThrow(
        'Invalid API key'
      );
    });

    it('should throw error when API returns 429 rate limit', async () => {
      const errorResponse = JSON.stringify({ error: 'Rate limit exceeded' });
      mockedAxios.post.mockResolvedValue({
        status: 429,
        data: Buffer.from(errorResponse),
      });

      await expect(removeBackground(mockImageBuffer)).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('should handle network errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      await expect(removeBackground(mockImageBuffer)).rejects.toThrow(
        'Network Error'
      );
    });

    it('should handle timeout errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('timeout of 30000ms exceeded'));

      await expect(removeBackground(mockImageBuffer)).rejects.toThrow(
        'timeout of 30000ms exceeded'
      );
    });

    it('should return buffer from arraybuffer response', async () => {
      const responseData = new Uint8Array([1, 2, 3, 4, 5]).buffer;
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: responseData,
      });

      const result = await removeBackground(mockImageBuffer);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should pass empty CLIPDROP_API_KEY as empty string check', async () => {
      process.env.CLIPDROP_API_KEY = '';

      await expect(removeBackground(mockImageBuffer)).rejects.toThrow(
        'CLIPDROP_API_KEY is not configured'
      );
    });
  });
});
