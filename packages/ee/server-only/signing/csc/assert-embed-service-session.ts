// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
export type AssertEmbedCscServiceSessionOptions = {
  request: Request;
  token: string;
  envelope: { signatureLevel: string };
  isCompleted: boolean;
  isRejected: boolean;
};

/** CSC signing is not available, so there is no service session to assert. */
export const assertEmbedCscServiceSession = async (_options: AssertEmbedCscServiceSessionOptions): Promise<void> => {};
