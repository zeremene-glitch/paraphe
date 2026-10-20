// SPDX-License-Identifier: AGPL-3.0-only — Paraphe replacement stub (original commercial code removed).
import { prisma } from '@documenso/prisma';

import { SELFHOSTED_PLAN_LIMITS } from './constants';
import { ERROR_CODES } from './errors';
import type { TLimitsResponseSchema } from './schema';

export type GetServerLimitsOptions = {
  userId: number;
  teamId: number;
};

/**
 * Paraphe has no billing, so quotas are always unlimited. Only the per-envelope
 * item cap comes from the organisation claim.
 */
export const getServerLimits = async ({ userId, teamId }: GetServerLimitsOptions): Promise<TLimitsResponseSchema> => {
  const organisation = await prisma.organisation.findFirst({
    where: {
      teams: { some: { id: teamId } },
      members: { some: { userId } },
    },
    select: {
      organisationClaim: { select: { envelopeItemCount: true } },
    },
  });

  if (!organisation) {
    throw new Error(ERROR_CODES.USER_FETCH_FAILED);
  }

  return {
    quota: SELFHOSTED_PLAN_LIMITS,
    remaining: SELFHOSTED_PLAN_LIMITS,
    maximumEnvelopeItemCount: organisation.organisationClaim.envelopeItemCount,
  };
};
