import Stripe from 'stripe';
import { env, hasStripe } from '../env.js';

let client: Stripe | null = null;

/** Returns a Stripe client, or `null` when the app runs in demo mode. */
export function getStripe(): Stripe | null {
  if (!hasStripe()) return null;
  if (!client) {
    client = new Stripe(env.stripe.secretKey, { apiVersion: '2024-06-20' as Stripe.LatestApiVersion });
  }
  return client;
}

export const toMinorUnits = (amount: number): number => Math.round(Number(amount || 0) * 100);
