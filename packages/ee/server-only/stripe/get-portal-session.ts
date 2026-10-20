// SPDX-License-Identifier: AGPL-3.0-only — Paraphe replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';

export type GetPortalSessionOptions = {
  customerId: string;
  returnUrl?: string;
};

export const getPortalSession = async (_options: GetPortalSessionOptions): Promise<string> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'Billing is not available in Paraphe' });
};
