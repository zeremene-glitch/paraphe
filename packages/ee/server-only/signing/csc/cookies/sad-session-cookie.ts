// SPDX-License-Identifier: AGPL-3.0-only — Paraphe replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { Context } from 'hono';

type SetCscSadSessionCookieOptions = {
  c: Context;
  sessionId: string;
  expiresAt: Date;
};

export const setCscSadSessionCookie = async (_options: SetCscSadSessionCookieOptions): Promise<void> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'CSC signing is not available in Paraphe' });
};

export const readCscSadSessionFromRequest = async (_request: Request): Promise<string | null> => {
  return null;
};
