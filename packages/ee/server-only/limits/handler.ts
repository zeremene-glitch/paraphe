// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
import { getSession } from '@documenso/auth/server/lib/utils/get-session';

import { ERROR_CODES } from './errors';
import { getServerLimits } from './server';

export const limitsHandler = async (req: Request) => {
  try {
    const { user } = await getSession(req);

    const rawTeamId = req.headers.get('team-id');
    const teamId = rawTeamId ? parseInt(rawTeamId, 10) : NaN;

    if (!teamId || isNaN(teamId)) {
      throw new Error('INVALID_TEAM_ID');
    }

    const limits = await getServerLimits({ userId: user.id, teamId });

    return Response.json(limits, { status: 200 });
  } catch (err) {
    console.error('error', err);

    const message = err instanceof Error ? err.message : 'UNKNOWN';

    return Response.json(
      { error: ERROR_CODES[message] ?? ERROR_CODES.UNKNOWN },
      { status: message === 'UNAUTHORIZED' ? 401 : 500 },
    );
  }
};
