// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
import type { TLimitsSchema } from './schema';

// Scriptia has no plans: every limit set is unlimited.
export const FREE_PLAN_LIMITS: TLimitsSchema = {
  documents: Infinity,
  recipients: Infinity,
  directTemplates: Infinity,
};

export const INACTIVE_PLAN_LIMITS: TLimitsSchema = {
  documents: Infinity,
  recipients: Infinity,
  directTemplates: Infinity,
};

export const PAID_PLAN_LIMITS: TLimitsSchema = {
  documents: Infinity,
  recipients: Infinity,
  directTemplates: Infinity,
};

export const SELFHOSTED_PLAN_LIMITS: TLimitsSchema = {
  documents: Infinity,
  recipients: Infinity,
  directTemplates: Infinity,
};

/**
 * Initial value for the frontend before values are loaded from the server.
 */
export const DEFAULT_MINIMUM_ENVELOPE_ITEM_COUNT = 5;

/**
 * Initial value for the frontend before values are loaded from the server.
 *
 * 0 = Unlimited recipients.
 */
export const DEFAULT_RECIPIENT_COUNT = 20;
