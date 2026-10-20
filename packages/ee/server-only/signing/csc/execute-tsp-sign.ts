// SPDX-License-Identifier: AGPL-3.0-only — Paraphe replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { RequestMetadata } from '@documenso/lib/universal/extract-request-metadata';

export type ExecuteTspSignOptions = {
  sessionId: string;
  recipientToken: string;
  requestMetadata?: RequestMetadata;
};

export type ExecuteTspSignResult = { outcome: 'signed' } | { outcome: 'already_signed' };

export const executeTspSign = async (_options: ExecuteTspSignOptions): Promise<ExecuteTspSignResult> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'CSC signing is not available in Paraphe' });
};
