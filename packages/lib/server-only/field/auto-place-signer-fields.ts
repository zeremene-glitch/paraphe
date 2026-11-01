import type { ApiRequestMetadata } from '@documenso/lib/universal/extract-request-metadata';
import { getFileServerSide } from '@documenso/lib/universal/upload/get-file.server';
import { prisma } from '@documenso/prisma';
import { PDF } from '@libpdf/core';
import { EnvelopeType, FieldType, RecipientRole } from '@prisma/client';

import { AppError, AppErrorCode } from '../../errors/app-error';
import {
  FIELD_DATE_META_DEFAULT_VALUES,
  FIELD_NAME_META_DEFAULT_VALUES,
  FIELD_SIGNATURE_META_DEFAULT_VALUES,
} from '../../types/field-meta';
import type { EnvelopeIdOptions } from '../../utils/envelope';
import { getEnvelopeWhereInput } from '../envelope/get-envelope-by-id';
import { type CreateEnvelopeFieldInput, createEnvelopeFields } from './create-envelope-fields';

/**
 * Scriptia: give every signer who has no fields yet a signature, name and date
 * field at the bottom of the last page, one row per signer. People can then
 * move or delete them in the editor, but most never need to.
 *
 * Positions are percentages of the page, like every other field.
 */

// One row per signer, stacked upwards from near the bottom of the page.
const ROW_HEIGHT = 5;
const ROW_GAP = 2;
const BOTTOM_ROW_Y = 86;
const MAX_ROWS = 8;

// Signature, name and date sit side by side within a row.
const COLUMNS = [
  { type: FieldType.SIGNATURE, x: 8, width: 32, fieldMeta: FIELD_SIGNATURE_META_DEFAULT_VALUES },
  { type: FieldType.NAME, x: 44, width: 26, fieldMeta: FIELD_NAME_META_DEFAULT_VALUES },
  { type: FieldType.DATE, x: 74, width: 18, fieldMeta: FIELD_DATE_META_DEFAULT_VALUES },
] as const;

export type AutoPlaceSignerFieldsOptions = {
  userId: number;
  teamId: number;
  id: EnvelopeIdOptions;
  requestMetadata: ApiRequestMetadata;
};

export const autoPlaceSignerFields = async ({ userId, teamId, id, requestMetadata }: AutoPlaceSignerFieldsOptions) => {
  const { envelopeWhereInput } = await getEnvelopeWhereInput({
    id,
    type: EnvelopeType.DOCUMENT,
    userId,
    teamId,
  });

  const envelope = await prisma.envelope.findFirst({
    where: envelopeWhereInput,
    include: {
      recipients: {
        orderBy: [{ signingOrder: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
      },
      fields: { select: { recipientId: true } },
      envelopeItems: {
        orderBy: { order: 'asc' },
        include: { documentData: true },
      },
    },
  });

  if (!envelope) {
    throw new AppError(AppErrorCode.NOT_FOUND, { message: 'Envelope not found' });
  }

  const signersWithoutFields = envelope.recipients.filter(
    (recipient) =>
      recipient.role === RecipientRole.SIGNER && !envelope.fields.some((field) => field.recipientId === recipient.id),
  );

  const lastItem = envelope.envelopeItems.at(-1);

  if (signersWithoutFields.length === 0 || !lastItem) {
    return { placed: 0 };
  }

  const bytes = await getFileServerSide(lastItem.documentData);
  const pdf = await PDF.load(new Uint8Array(bytes));
  const lastPage = pdf.getPages().length;

  const fields: CreateEnvelopeFieldInput[] = signersWithoutFields.flatMap((recipient, index) => {
    // Past MAX_ROWS the rows start again from the bottom; rare, and still movable.
    const row = index % MAX_ROWS;
    const positionY = BOTTOM_ROW_Y - row * (ROW_HEIGHT + ROW_GAP);

    return COLUMNS.map(
      (column) =>
        ({
          type: column.type,
          fieldMeta: column.fieldMeta,
          envelopeItemId: lastItem.id,
          recipientId: recipient.id,
          page: lastPage,
          positionX: column.x,
          positionY,
          width: column.width,
          height: ROW_HEIGHT,
        }) as CreateEnvelopeFieldInput,
    );
  });

  await createEnvelopeFields({ userId, teamId, id, fields, requestMetadata });

  return { placed: signersWithoutFields.length };
};
