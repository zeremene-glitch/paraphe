// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { EmailDomain } from '@prisma/client';

export const verifyEmailDomain = async (
  _emailDomainId: string,
): Promise<{ emailDomain: EmailDomain; isVerified: boolean }> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'Email domains are not available in Scriptia' });
};
