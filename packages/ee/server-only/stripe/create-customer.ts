// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { Stripe } from '@documenso/lib/server-only/stripe';

type CreateCustomerOptions = {
  name: string;
  email: string;
};

export const createCustomer = async (_options: CreateCustomerOptions): Promise<Stripe.Customer> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'Billing is not available in Scriptia' });
};
