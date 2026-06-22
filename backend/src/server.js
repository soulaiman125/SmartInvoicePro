import 'dotenv/config';
import app from './app.js';
import { env, validateProductionEnv } from './config/env.js';

// Fail fast on insecure production configuration.
validateProductionEnv();

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`SmartInvoice Pro API listening on http://localhost:${env.port}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received. Closing server...`);
  server.close(() => process.exit(0));
};

['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));
