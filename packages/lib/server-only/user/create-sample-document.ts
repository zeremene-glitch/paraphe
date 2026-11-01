import { prisma } from '@documenso/prisma';
import { DocumentDistributionMethod, EnvelopeType, OrganisationType, RecipientRole } from '@prisma/client';

import type { ApiRequestMetadata } from '../../universal/extract-request-metadata';
import { putPdfFileServerSide } from '../../universal/upload/put-file.server';
import { sendDocument } from '../document/send-document';
import { createEnvelope } from '../envelope/create-envelope';
import { autoPlaceSignerFields } from '../field/auto-place-signer-fields';

/**
 * Scriptia: every new account starts with one sample document, already waiting
 * for the new user's own signature, so they can try the whole flow in a minute
 * without uploading anything. Nothing is emailed.
 */

const SAMPLE_TITLE = 'Sample - try signing me.pdf';

const SAMPLE_LINES: Array<{ text: string; size: number; gap: number }> = [
  { text: 'Welcome to Scriptia', size: 26, gap: 0 },
  { text: 'This is a sample document so you can try signing.', size: 13, gap: 44 },
  { text: 'Nothing here is binding and nobody else receives it.', size: 13, gap: 20 },
  { text: 'How it works', size: 16, gap: 44 },
  { text: '1.  Press Start. It takes you to each field in turn.', size: 12, gap: 26 },
  { text: '2.  Draw, type or upload your signature.', size: 12, gap: 20 },
  { text: '3.  Press Complete. You can then download the signed PDF.', size: 12, gap: 20 },
  { text: 'When you are ready, go back to Documents and choose', size: 12, gap: 40 },
  { text: '"Just me" to sign your own file, or "Send for signature".', size: 12, gap: 18 },
];

const escapePdfText = (text: string) => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

/**
 * A one-page A4 PDF built by hand, so there is no asset file to ship.
 */
const buildSamplePdf = () => {
  let y = 760;

  const textOps = SAMPLE_LINES.map(({ text, size, gap }) => {
    y -= gap;

    return `BT /F1 ${size} Tf 72 ${y} Td (${escapePdfText(text)}) Tj ET`;
  }).join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${textOps.length} >>\nstream\n${textOps}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;

  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
};

export const createSampleDocument = async ({ userId }: { userId: number }) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const team = await prisma.team.findFirst({
    where: {
      organisation: {
        ownerUserId: userId,
        type: OrganisationType.PERSONAL,
      },
    },
    include: { _count: { select: { envelopes: true } } },
  });

  // Only for a brand-new, empty personal team.
  if (!team || team._count.envelopes > 0) {
    return;
  }

  const requestMetadata: ApiRequestMetadata = {
    source: 'app',
    auth: 'session',
    requestMetadata: {},
  };

  const file = new File([buildSamplePdf()], SAMPLE_TITLE, { type: 'application/pdf' });
  const { documentData } = await putPdfFileServerSide(file);

  const envelope = await createEnvelope({
    userId,
    teamId: team.id,
    internalVersion: 2,
    bypassDefaultRecipients: true,
    data: {
      type: EnvelopeType.DOCUMENT,
      title: SAMPLE_TITLE,
      envelopeItems: [{ title: SAMPLE_TITLE, documentDataId: documentData.id }],
      recipients: [{ email: user.email, name: user.name ?? '', role: RecipientRole.SIGNER, signingOrder: 1 }],
    },
    meta: {
      distributionMethod: DocumentDistributionMethod.NONE,
    },
    requestMetadata,
  });

  const id = { type: 'envelopeId', id: envelope.id } as const;

  await autoPlaceSignerFields({ userId, teamId: team.id, id, requestMetadata });
  await sendDocument({ id, userId, teamId: team.id, requestMetadata });
};
