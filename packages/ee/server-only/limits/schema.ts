// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
import { z } from 'zod';

import { DEFAULT_MINIMUM_ENVELOPE_ITEM_COUNT } from './constants';

// JSON cannot carry Infinity, so it travels as null and is turned back here.
const ZLimitValue = z
  .preprocess((v) => (v === null ? Infinity : Number(v)), z.number())
  .optional()
  .default(0);

export const ZLimitsSchema = z.object({
  documents: ZLimitValue,
  recipients: ZLimitValue,
  directTemplates: ZLimitValue,
});

export type TLimitsSchema = z.infer<typeof ZLimitsSchema>;

export const ZLimitsResponseSchema = z.object({
  quota: ZLimitsSchema,
  remaining: ZLimitsSchema,
  maximumEnvelopeItemCount: z.number().optional().default(DEFAULT_MINIMUM_ENVELOPE_ITEM_COUNT),
});

export type TLimitsResponseSchema = z.infer<typeof ZLimitsResponseSchema>;

export const ZLimitsErrorResponseSchema = z.object({
  error: z.string(),
});

export type TLimitsErrorResponseSchema = z.infer<typeof ZLimitsErrorResponseSchema>;
