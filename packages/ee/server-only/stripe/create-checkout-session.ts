// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';

export type CreateCheckoutSessionOptions = {
  customerId: string;
  priceId: string;
  returnUrl: string;
};

export const createCheckoutSession = async (_options: CreateCheckoutSessionOptions): Promise<string> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'Billing is not available in Scriptia' });
};
