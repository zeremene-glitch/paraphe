// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { Stripe } from '@documenso/lib/server-only/stripe';
import type { Subscription } from '@prisma/client';

export type GetSubscriptionOptions = {
  userId: number;
  organisationId: string;
};

export const getSubscription = async (
  _options: GetSubscriptionOptions,
): Promise<{
  organisationSubscription: Subscription;
  stripeSubscription: Stripe.Response<Stripe.Subscription>;
} | null> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'Billing is not available in Scriptia' });
};
