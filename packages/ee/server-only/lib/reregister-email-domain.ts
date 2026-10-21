// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { EmailDomain } from '@prisma/client';

type ReregisterEmailDomainOptions = {
  emailDomainId: string;
};

export const reregisterEmailDomain = async (_options: ReregisterEmailDomainOptions): Promise<EmailDomain> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'Email domains are not available in Scriptia' });
};
