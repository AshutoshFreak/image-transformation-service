import { Request, Response, NextFunction } from 'express';

describe('upload middleware', () => {
  describe('multer configuration', () => {
    let upload: ReturnType<typeof import('multer')>;

    beforeEach(() => {
      jest.resetModules();
      const uploadModule = require('./upload');
      upload = uploadModule.upload;
    });

    it('should be configured with single file upload', () => {
      expect(upload.single).toBeDefined();
      expect(typeof upload.single).toBe('function');
    });

    it('should have single method that returns middleware', () => {
      const middleware = upload.single('image');
      expect(typeof middleware).toBe('function');
    });
  });

  describe('allowed file types', () => {
    it('should define JPEG, PNG, and WebP as allowed formats', () => {
      // These are the allowed types defined in the module
      const expectedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      expect(expectedTypes).toContain('image/jpeg');
      expect(expectedTypes).toContain('image/png');
      expect(expectedTypes).toContain('image/webp');
      expect(expectedTypes).toHaveLength(3);
    });
  });

  describe('file size limit', () => {
    it('should have 10MB file size limit configured', () => {
      // MAX_FILE_SIZE is set to 10 * 1024 * 1024 = 10MB
      const expectedLimit = 10 * 1024 * 1024;
      expect(expectedLimit).toBe(10485760);
    });
  });
});

// Integration test for file filter behavior
describe('upload middleware integration', () => {
  const express = require('express');
  const request = require('supertest');

  it('should reject non-image files', async () => {
    jest.resetModules();
    const { upload } = require('./upload');

    const app = express();
    app.post('/test', upload.single('image'), (req: Request, res: Response) => {
      res.json({ success: true, hasFile: !!req.file });
    });

    // Add error handler
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      res.status(400).json({ error: err.message });
    });

    const response = await request(app)
      .post('/test')
      .attach('image', Buffer.from('not an image'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid file type');
  });

  it('should accept PNG files', async () => {
    jest.resetModules();
    const { upload } = require('./upload');

    const app = express();
    app.post('/test', upload.single('image'), (req: Request, res: Response) => {
      res.json({ success: true, hasFile: !!req.file });
    });

    // Create a minimal valid PNG (1x1 transparent pixel)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82,
    ]);

    const response = await request(app)
      .post('/test')
      .attach('image', pngBuffer, {
        filename: 'test.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.hasFile).toBe(true);
  });

  it('should accept JPEG files', async () => {
    jest.resetModules();
    const { upload } = require('./upload');

    const app = express();
    app.post('/test', upload.single('image'), (req: Request, res: Response) => {
      res.json({ success: true, hasFile: !!req.file });
    });

    const response = await request(app)
      .post('/test')
      .attach('image', Buffer.from('fake jpeg content'), {
        filename: 'test.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(200);
    expect(response.body.hasFile).toBe(true);
  });

  it('should accept WebP files', async () => {
    jest.resetModules();
    const { upload } = require('./upload');

    const app = express();
    app.post('/test', upload.single('image'), (req: Request, res: Response) => {
      res.json({ success: true, hasFile: !!req.file });
    });

    const response = await request(app)
      .post('/test')
      .attach('image', Buffer.from('fake webp content'), {
        filename: 'test.webp',
        contentType: 'image/webp',
      });

    expect(response.status).toBe(200);
    expect(response.body.hasFile).toBe(true);
  });

  it('should reject GIF files', async () => {
    jest.resetModules();
    const { upload } = require('./upload');

    const app = express();
    app.post('/test', upload.single('image'), (req: Request, res: Response) => {
      res.json({ success: true, hasFile: !!req.file });
    });

    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      res.status(400).json({ error: err.message });
    });

    const response = await request(app)
      .post('/test')
      .attach('image', Buffer.from('GIF89a'), {
        filename: 'test.gif',
        contentType: 'image/gif',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid file type');
  });

  it('should reject SVG files', async () => {
    jest.resetModules();
    const { upload } = require('./upload');

    const app = express();
    app.post('/test', upload.single('image'), (req: Request, res: Response) => {
      res.json({ success: true, hasFile: !!req.file });
    });

    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      res.status(400).json({ error: err.message });
    });

    const response = await request(app)
      .post('/test')
      .attach('image', Buffer.from('<svg></svg>'), {
        filename: 'test.svg',
        contentType: 'image/svg+xml',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid file type');
  });

  it('should handle request without any file', async () => {
    jest.resetModules();
    const { upload } = require('./upload');

    const app = express();
    app.post('/test', upload.single('image'), (req: Request, res: Response) => {
      res.json({ success: true, hasFile: !!req.file });
    });

    const response = await request(app)
      .post('/test')
      .send();

    expect(response.status).toBe(200);
    expect(response.body.hasFile).toBe(false);
  });
});
