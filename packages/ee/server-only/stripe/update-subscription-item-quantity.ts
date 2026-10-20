// SPDX-License-Identifier: AGPL-3.0-only — Paraphe replacement stub (original commercial code removed).
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { OrganisationClaim, Subscription } from '@prisma/client';

/**
 * Member-count cap check. Without Stripe there are no seat-based plans, so only
 * the claim hard cap (0 = unlimited) applies.
 */
export const assertMemberCountWithinCap = async (
  _subscription: Subscription | null,
  organisationClaim: OrganisationClaim,
  quantity: number,
): Promise<void> => {
  const maximumMemberCount = organisationClaim.memberCount;

  if (maximumMemberCount !== 0 && quantity > maximumMemberCount) {
    throw new AppError(AppErrorCode.LIMIT_EXCEEDED, {
      message: 'Maximum member count reached',
    });
  }
};

/**
 * There is no Stripe seat plan to keep in sync, so this is a no-op.
 */
export const syncMemberCountWithStripeSeatPlan = async (
  _subscription: Subscription,
  _organisationClaim: OrganisationClaim,
  _quantity: number,
  _mode: 'grow' | 'shrink',
): Promise<void> => {};
