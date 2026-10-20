// SPDX-License-Identifier: AGPL-3.0-only — Paraphe replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';

export type MaterializeTspAnchorsForEnvelopeOptions = {
  envelopeId: string;
};

/** Only reached for AES/QES (TSP) envelopes, which cannot be created in Paraphe. */
export const materializeTspAnchorsForEnvelope = async (
  _options: MaterializeTspAnchorsForEnvelopeOptions,
): Promise<void> => {
  throw new AppError(AppErrorCode.NOT_SETUP, { message: 'CSC signing is not available in Paraphe' });
};
