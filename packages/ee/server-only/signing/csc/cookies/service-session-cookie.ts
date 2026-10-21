// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { Context } from 'hono';

type SetCscServiceSessionCookieOptions = {
  c: Context;
  recipientToken: string;
  ttlSeconds: number;
};

export const setCscServiceSessionCookie = async (_options: SetCscServiceSessionCookieOptions): Promise<void> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'CSC signing is not available in Scriptia' });
};

export const readCscServiceSessionFromRequest = async (_request: Request): Promise<string | null> => {
  return null;
};
