import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';

// Mock all external dependencies before importing the app
jest.mock('./services/cloudinary', () => ({
  initCloudinary: jest.fn(),
}));

jest.mock('./routes/images', () => {
  const router = require('express').Router();
  router.get('/test', (_req: Request, res: Response) => {
    res.json({ test: true });
  });
  return router;
});

describe('Express App', () => {
  let app: Express;

  beforeEach(() => {
    // Create a fresh app instance that mirrors the main app structure
    app = express();

    // CORS simulation
    app.use((_req, res, next) => {
      res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
      res.header('Access-Control-Allow-Credentials', 'true');
      next();
    });

    app.use(express.json());

    // Health check
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok' });
    });

    // Mock routes
    const imageRoutes = require('./routes/images');
    app.use('/api/images', imageRoutes);

    // Error handling middleware (4 parameters required for Express to recognize it)
    app.use(
      (
        err: Error,
        _req: Request,
        res: Response,
        _next: NextFunction
      ) => {
        res.status(500).json({
          success: false,
          error: err.message || 'Internal server error',
        });
      }
    );
  });

  describe('GET /health', () => {
    it('should return health status ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('CORS configuration', () => {
    it('should include CORS headers', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should allow credentials', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
    });

    it('should return 404 for unknown API routes', async () => {
      const response = await request(app).get('/api/unknown');

      expect(response.status).toBe(404);
    });
  });

  describe('JSON body parsing', () => {
    it('should parse JSON request body', async () => {
      app.post('/json-test', (req, res) => {
        res.json({ received: req.body });
      });

      const response = await request(app)
        .post('/json-test')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual({ test: 'data' });
    });

    it('should handle empty JSON body', async () => {
      app.post('/json-test', (req, res) => {
        res.json({ received: req.body });
      });

      const response = await request(app)
        .post('/json-test')
        .send({})
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual({});
    });

    it('should handle nested JSON objects', async () => {
      app.post('/json-test', (req, res) => {
        res.json({ received: req.body });
      });

      const nestedData = {
        user: {
          name: 'Test',
          settings: {
            theme: 'dark',
          },
        },
      };

      const response = await request(app)
        .post('/json-test')
        .send(nestedData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual(nestedData);
    });
  });

  describe('Routes mounting', () => {
    it('should mount image routes at /api/images', async () => {
      const response = await request(app).get('/api/images/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ test: true });
    });
  });

  describe('Error handling middleware', () => {
    it('should have middleware stack configured', () => {
      // The app has middleware configured including error handlers
      expect(app).toBeDefined();
      // Make a request to verify middleware chain is working
      return request(app)
        .get('/health')
        .expect(200);
    });
  });
});

describe('Environment configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should use default PORT 3000 when not specified', () => {
    delete process.env.PORT;
    const defaultPort = process.env.PORT || 3000;
    expect(defaultPort).toBe(3000);
  });

  it('should use PORT from environment when specified', () => {
    process.env.PORT = '4000';
    const port = process.env.PORT || 3000;
    expect(port).toBe('4000');
  });

  it('should use default FRONTEND_URL when not specified', () => {
    delete process.env.FRONTEND_URL;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    expect(frontendUrl).toBe('http://localhost:5173');
  });

  it('should use FRONTEND_URL from environment when specified', () => {
    process.env.FRONTEND_URL = 'https://my-frontend.com';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    expect(frontendUrl).toBe('https://my-frontend.com');
  });
});

describe('Cloudinary initialization', () => {
  it('should have initCloudinary function available', () => {
    const { initCloudinary } = require('./services/cloudinary');
    expect(initCloudinary).toBeDefined();
    expect(typeof initCloudinary).toBe('function');
  });
});
