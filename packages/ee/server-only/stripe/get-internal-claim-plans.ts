// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { Stripe } from '@documenso/lib/server-only/stripe';
import type { INTERNAL_CLAIM_ID, InternalClaim } from '@documenso/lib/types/subscription';

export type InternalClaimPlans = {
  [key in INTERNAL_CLAIM_ID]: InternalClaim & {
    monthlyPrice?: Stripe.Price & {
      product: Stripe.Product;
      isVisibleInApp: boolean;
      friendlyPrice: string;
    };
    yearlyPrice?: Stripe.Price & {
      product: Stripe.Product;
      isVisibleInApp: boolean;
      friendlyPrice: string;
    };
  };
};

export const getInternalClaimPlans = async (): Promise<InternalClaimPlans> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'Billing plans are not available in Scriptia' });
};
