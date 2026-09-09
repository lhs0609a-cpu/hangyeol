import { beforeEach, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ findUnique: vi.fn(), request: vi.fn() }));
vi.mock('../src/guard.js', () => ({ db: () => ({ paymentOrder: { findUnique: fixture.findUnique } }) }));
vi.mock('../src/payments.js', () => ({ handlePgWebhook: vi.fn() }));
vi.mock('../src/payment-provider.js', async importOriginal => ({
  ...await importOriginal<typeof import('../src/payment-provider.js')>(), tossRequest: fixture.request,
}));
import { confirmCheckout } from '../src/checkout.js';

beforeEach(() => {
  vi.clearAllMocks();
  fixture.findUnique.mockResolvedValue({ id: 'owned-order', teacherId: 1n, amount: 10000, status: 'pending' });
});

it('rejects a provider response for a different order before fulfillment', async () => {
  fixture.request.mockResolvedValue({ orderId: 'another-order', paymentKey: 'key', totalAmount: 10000, currency: 'KRW', status: 'DONE' });
  await expect(confirmCheckout(1n, { orderId: 'owned-order', paymentKey: 'key', amount: 10000 })).rejects.toThrow();
  expect(fixture.findUnique).toHaveBeenCalledTimes(1);
});

it('rejects a provider response with a different payment key before fulfillment', async () => {
  fixture.request.mockResolvedValue({ orderId: 'owned-order', paymentKey: 'other-key', totalAmount: 10000, currency: 'KRW', status: 'DONE' });
  await expect(confirmCheckout(1n, { orderId: 'owned-order', paymentKey: 'key', amount: 10000 })).rejects.toThrow();
  expect(fixture.findUnique).toHaveBeenCalledTimes(1);
});
