import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webhookRouter from './routes/webhook';
import { webhookRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/error';
import { ExtendedRequest } from './middleware/signature';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// Enable CORS
app.use(cors());

// Capture raw body buffer for webhook signature validation
app.use(
  express.json({
    verify: (req: ExtendedRequest, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Register routes with Redis-backed rate limiter
app.use('/api/webhook/whatsapp', webhookRateLimiter, webhookRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'WhatsApp API service is healthy' });
});

// Centralized error handler middleware
app.use(errorHandler);

app.listen(port, () => {
  console.log(`[Server]: Node.js TypeScript server running on http://localhost:${port}`);
});
