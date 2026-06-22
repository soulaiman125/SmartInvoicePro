import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import './utils/serializer.js'; // enable BigInt JSON serialization
import { env } from './config/env.js';
import routes from './routes/index.js';
import { apiLimiter, authLimiter } from './middleware/rateLimit.middleware.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const app = express();

// Behind a proxy (nginx/Docker) so rate-limit & IPs resolve correctly.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(morgan(env.isProd ? 'combined' : 'dev'));

// Rate limiting: stricter on auth, general elsewhere. Disabled under test.
if (!env.isTest) {
  app.use('/api/v1/auth', authLimiter);
  app.use('/api/v1', apiLimiter);
}

// API routes (versioned)
app.use('/api/v1', routes);

// 404 + error handling
app.use(notFound);
app.use(errorHandler);

export default app;
