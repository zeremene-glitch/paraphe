// SPDX-License-Identifier: AGPL-3.0-only — Paraphe replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { RequestMetadata } from '@documenso/lib/universal/extract-request-metadata';

export type PrepareCscRecipientSigningOptions = {
  recipientToken: string;
  requestMetadata?: RequestMetadata;
};

export type PrepareCscRecipientSigningResult = {
  status: 'REDIRECT';
  redirectUrl: string;
  sessionId: string;
};

export const prepareCscRecipientSigning = async (
  _options: PrepareCscRecipientSigningOptions,
): Promise<PrepareCscRecipientSigningResult> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'CSC signing is not available in Paraphe' });
};
