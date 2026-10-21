// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { RequestMetadata } from '@documenso/lib/universal/extract-request-metadata';
import type { CreateDocumentAuditLogDataResponse } from '@documenso/lib/utils/document-audit-logs';
import type { DocumentData, DocumentMeta, Envelope, EnvelopeItem, Recipient, User } from '@prisma/client';

export type FinalizeTspEnvelopeCompletionOptions = {
  envelope: Envelope & {
    documentMeta: DocumentMeta | null;
    recipients: Recipient[];
    envelopeItems: Array<EnvelopeItem & { documentData: DocumentData }>;
    user: Pick<User, 'name' | 'email'>;
  };
  envelopeCompletedAuditLog: CreateDocumentAuditLogDataResponse;
  requestMetadata?: RequestMetadata;
};

/** Only reached for AES/QES (TSP) envelopes, which cannot be created in Scriptia. */
export const finalizeTspEnvelopeCompletion = async (_options: FinalizeTspEnvelopeCompletionOptions): Promise<void> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'CSC signing is not available in Scriptia' });
};
