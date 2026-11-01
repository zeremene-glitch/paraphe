import { autoPlaceSignerFields } from '@documenso/lib/server-only/field/auto-place-signer-fields';

import { authenticatedProcedure } from '../trpc';
import { ZAutoPlaceFieldsRequestSchema, ZAutoPlaceFieldsResponseSchema } from './auto-place-fields.types';

/**
 * Scriptia: place signature, name and date fields for every signer who has none.
 */
export const autoPlaceFieldsRoute = authenticatedProcedure
  .input(ZAutoPlaceFieldsRequestSchema)
  .output(ZAutoPlaceFieldsResponseSchema)
  .mutation(async ({ input, ctx }) => {
    const { teamId } = ctx;
    const { envelopeId } = input;

    ctx.logger.info({
      input: {
        envelopeId,
      },
    });

    return await autoPlaceSignerFields({
      userId: ctx.user.id,
      teamId,
      id: {
        type: 'envelopeId',
        id: envelopeId,
      },
      requestMetadata: ctx.metadata,
    });
  });
