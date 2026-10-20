// SPDX-License-Identifier: AGPL-3.0-only — Paraphe replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';

type DeleteEmailDomainOptions = {
  emailDomainId: string;
};

export const deleteEmailDomain = async (_options: DeleteEmailDomainOptions): Promise<void> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'Email domains are not available in Paraphe' });
};
