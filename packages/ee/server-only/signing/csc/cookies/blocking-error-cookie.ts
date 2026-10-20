// SPDX-License-Identifier: AGPL-3.0-only — Paraphe replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { Context } from 'hono';

export type TCscBlockingErrorPayload = {
  code: string;
  recipientToken: string;
};

type SetCscBlockingErrorCookieOptions = {
  c: Context;
  payload: TCscBlockingErrorPayload;
};

export const setCscBlockingErrorCookie = async (_options: SetCscBlockingErrorCookieOptions): Promise<void> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'CSC signing is not available in Paraphe' });
};

/** No CSC cookie can exist, so there is never a blocking error. */
export const readCscBlockingErrorFromRequest = async (_request: Request): Promise<TCscBlockingErrorPayload | null> => {
  return null;
};

/** Nothing to expire; an already-expired header keeps the caller shape valid. */
export const expiredCscBlockingErrorCookieHeader = (): string => {
  return 'csc_blocking_error=; Max-Age=0; Path=/';
};
