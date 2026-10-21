// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { EmailDomain, OrganisationEmail } from '@prisma/client';

type CreateEmailDomainOptions = {
  domain: string;
  organisationId: string;
};

type DomainRecord = {
  name: string;
  value: string;
  type: string;
};

export const createEmailDomain = async (
  _options: CreateEmailDomainOptions,
): Promise<{
  emailDomain: Omit<EmailDomain, 'privateKey'> & { emails: OrganisationEmail[] };
  records: DomainRecord[];
}> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'Email domains are not available in Scriptia' });
};
