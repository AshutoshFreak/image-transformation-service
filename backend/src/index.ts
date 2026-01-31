import express from 'express';
import cors from 'cors';
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

// Routes
app.use('/api/images', imageRoutes);

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
