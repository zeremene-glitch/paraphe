import { z } from 'zod';

export const ZAutoPlaceFieldsRequestSchema = z.object({
  envelopeId: z.string(),
});

export const ZAutoPlaceFieldsResponseSchema = z.object({
  placed: z.number().describe('How many signers received fields.'),
});

export type TAutoPlaceFieldsRequest = z.infer<typeof ZAutoPlaceFieldsRequestSchema>;
export type TAutoPlaceFieldsResponse = z.infer<typeof ZAutoPlaceFieldsResponseSchema>;
