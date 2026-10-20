// SPDX-License-Identifier: AGPL-3.0-only — Paraphe replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';

export type SyncStripeCustomerSubscriptionOptions = {
  customerId: string;

  /** When true, the organisationClaim is left untouched. */
  bypassClaimUpdate?: boolean;
};

export const syncStripeCustomerSubscription = async (
  _options: SyncStripeCustomerSubscriptionOptions,
): Promise<void> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'Billing is not available in Paraphe' });
};
