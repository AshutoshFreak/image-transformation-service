/**
 * Express server entry point.
 * Sets up CORS, routes, and error handling for the image processing API.
 */
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initCloudinary } from './services/cloudinary';
import imageRoutes from './routes/images';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Cloudinary
initCloudinary();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: { success: false, error: 'Too many requests, please try again later' },
});

// Routes
app.use('/api/images', apiLimiter, imageRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
