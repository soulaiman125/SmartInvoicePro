// Payment-gateway abstraction. Online providers (Stripe, PayPal) are wired here
// behind a single interface so the rest of the app stays provider-agnostic.
// Real SDK calls are intentionally stubbed until API keys are configured.
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

const SUPPORTED = ['stripe', 'paypal'];

// Create a hosted checkout session for an invoice (returns a redirect URL).
// eslint-disable-next-line no-unused-vars
export async function createCheckoutSession(organizationId, invoiceId, gateway) {
  if (!SUPPORTED.includes(gateway)) {
    throw ApiError.badRequest(`Unsupported gateway: ${gateway}`);
  }
  // TODO: integrate Stripe Checkout / PayPal Orders here using configured keys.
  throw ApiError.unprocessable(
    `${gateway} is not configured. Set the provider API keys to enable online payments.`,
  );
}

// Idempotently process an inbound gateway webhook. The unique
// (gateway, eventId) row guarantees re-deliveries are no-ops (idempotency).
export async function handleWebhook(gateway, eventId, handler) {
  if (!eventId) throw ApiError.badRequest('Missing event id');

  const already = await prisma.processedWebhookEvent.findUnique({
    where: { gateway_eventId: { gateway, eventId } },
  });
  if (already) return { duplicate: true };

  await handler();
  await prisma.processedWebhookEvent.create({ data: { gateway, eventId } });
  return { duplicate: false };
}
