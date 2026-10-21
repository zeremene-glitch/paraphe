// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { RequestMetadata } from '@documenso/lib/universal/extract-request-metadata';

export interface LinkOrganisationAccountOptions {
  token: string;
  requestMeta: RequestMetadata;
}

export const linkOrganisationAccount = async (_options: LinkOrganisationAccountOptions): Promise<void> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'Organisation account linking is not available in Scriptia' });
};
