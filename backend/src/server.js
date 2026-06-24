import 'dotenv/config';
import app from './app.js';
import { env, validateProductionEnv } from './config/env.js';
import { processDueRecurringInvoices } from './services/recurring.service.js';
import { processOverdueInvoices } from './services/invoice.service.js';

// Fail fast on insecure production configuration.
validateProductionEnv();

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`SmartInvoice Pro API listening on http://localhost:${env.port}`);
});

// Recurring-invoice scheduler: generate due invoices shortly after boot, then
// hourly. Best-effort and tenant-wide; disabled under test.
if (!env.isTest) {
  const runScheduledJobs = async () => {
    try {
      const r = await processDueRecurringInvoices();
      // eslint-disable-next-line no-console
      if (r.generated) console.log(`[recurring] generated ${r.generated} invoice(s)`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[recurring] run failed:', err.message);
    }
    try {
      const o = await processOverdueInvoices();
      // eslint-disable-next-line no-console
      if (o.updated) console.log(`[overdue] flagged ${o.updated} invoice(s) overdue`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[overdue] run failed:', err.message);
    }
  };
  setTimeout(runScheduledJobs, 15000);
  setInterval(runScheduledJobs, 60 * 60 * 1000).unref();
}

// Graceful shutdown
const shutdown = (signal) => {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received. Closing server...`);
  server.close(() => process.exit(0));
};

['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));
