// SPDX-License-Identifier: AGPL-3.0-only — Paraphe replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { TOrganisationAccountLinkMetadata } from '@documenso/lib/types/organisation';

export type SendOrganisationAccountLinkConfirmationEmailProps = TOrganisationAccountLinkMetadata & {
  organisationName: string;
};

export const sendOrganisationAccountLinkConfirmationEmail = async (
  _props: SendOrganisationAccountLinkConfirmationEmailProps,
): Promise<void> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'Organisation account linking is not available in Paraphe' });
};
