// SPDX-License-Identifier: AGPL-3.0-only — Paraphe replacement stub (original commercial code removed).
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_MINIMUM_ENVELOPE_ITEM_COUNT, PAID_PLAN_LIMITS } from '../constants';
import type { TLimitsResponseSchema } from '../schema';

export type LimitsContextValue = TLimitsResponseSchema & { refreshLimits: () => Promise<void> };

const LimitsContext = createContext<LimitsContextValue | null>(null);

export const useLimits = () => {
  const limits = useContext(LimitsContext);

  if (!limits) {
    throw new Error('useLimits must be used within a LimitsProvider');
  }

  return limits;
};

export type LimitsProviderProps = {
  initialValue?: TLimitsResponseSchema;
  disableLimitsFetch?: boolean;
  teamId: number;
  children?: React.ReactNode;
};

/**
 * Paraphe has no billing: limits are always unlimited, so nothing is fetched
 * and `refreshLimits` is a no-op. The server-provided item cap is honoured.
 */
export const LimitsProvider = ({ initialValue, children }: LimitsProviderProps) => {
  const maximumEnvelopeItemCount = initialValue?.maximumEnvelopeItemCount ?? DEFAULT_MINIMUM_ENVELOPE_ITEM_COUNT;

  const value = useMemo<LimitsContextValue>(
    () => ({
      quota: PAID_PLAN_LIMITS,
      remaining: PAID_PLAN_LIMITS,
      maximumEnvelopeItemCount,
      refreshLimits: async () => {},
    }),
    [maximumEnvelopeItemCount],
  );

  return <LimitsContext.Provider value={value}>{children}</LimitsContext.Provider>;
};
