// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { Stripe } from '@documenso/lib/server-only/stripe';

export type GetInvoicesOptions = {
  customerId: string;
};

export const getInvoices = async (_options: GetInvoicesOptions): Promise<Stripe.ApiList<Stripe.Invoice>> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'Billing is not available in Scriptia' });
};
