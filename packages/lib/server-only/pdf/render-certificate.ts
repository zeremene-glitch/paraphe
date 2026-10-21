// sort-imports-ignore
import '../konva/skia-backend';

import fs from 'node:fs';
import path from 'node:path';
import type { Canvas } from '@documenso/skia-canvas';
import { Image as SkiaImage } from '@documenso/skia-canvas';
import type { I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import type { Field, RecipientRole, Signature } from '@prisma/client';
import { DocumentStatus, RecipientRole as RecipientRoleEnum, SigningStatus } from '@prisma/client';
import Konva from 'konva';
import { DateTime } from 'luxon';
import { UAParser } from 'ua-parser-js';
import { renderSVG } from 'uqr';

import { NEXT_PRIVATE_SIGNING_TIMESTAMP_AUTHORITY, NEXT_PUBLIC_WEBAPP_URL } from '../../constants/app';
import { APP_I18N_OPTIONS } from '../../constants/i18n';
import { getSignatureFontFamily } from '../../constants/pdf';
import { RECIPIENT_ROLES_DESCRIPTION } from '../../constants/recipient-roles';
import type { TDocumentAuditLogBaseSchema } from '../../types/document-audit-logs';
import { svgToPng } from '../../utils/images/svg-to-png';
import type { OriginalDocumentDigest } from './get-original-document-digests';
import { ensureFontLibrary } from './helpers';

type BaseAuditLog = Pick<TDocumentAuditLogBaseSchema, 'createdAt' | 'ipAddress' | 'userAgent'>;

export type CertificateRecipient = {
  id: number;
  name: string;
  email: string;
  role: RecipientRole;
  rejectionReason: string | null;
  signingStatus: SigningStatus;
  signatureField?: Pick<Field, 'id' | 'secondaryId' | 'recipientId'> & {
    signature?: Pick<Signature, 'signatureImageAsBase64' | 'typedSignature'> | null;
  };
  authLevel: string;
  logs: {
    emailed: BaseAuditLog | null;
    sent: BaseAuditLog | null;
    opened: BaseAuditLog | null;
    completed: BaseAuditLog | null;
    rejected: BaseAuditLog | null;
  };
};

type GenerateCertificateOptions = {
  recipients: CertificateRecipient[];
  envelopeId: string;
  envelopeTitle: string;
  envelopeStatus: DocumentStatus;
  createdAt: Date;
  completedAt: Date | null;
  originalDocuments: OriginalDocumentDigest[];
  qrToken: string | null;
  hidePoweredBy: boolean;
  i18n: I18n;
  envelopeOwner: {
    name: string;
    email: string;
  };
  pageWidth: number;
  pageHeight: number;
};

// Palette (matches the Scriptia certificate prototype).
const colorInk = '#0B1530';
const colorMuted = '#5B6476';
const colorSoft = '#8A93A3';
const colorLine = '#E3E8F0';
const colorTint = '#F5F7FB';
const colorBlue = '#2457FF';
const colorIce = '#EAF2FF';
const colorOk = '#0F7B4B';
const colorOkBg = '#E7F6EE';
const colorRejected = '#B42318';

const fontFamily = 'Inter';
const monoFontFamily = 'monospace';

// Page geometry (pt). 16mm sides/top, 22mm bottom like the prototype.
const pageSideMargin = 45;
const pageTopMargin = 40;
const footerBottomMargin = 24;
const footerReservedHeight = 58;
const contentMaxWidth = 768;
const sectionGap = 16;
const cardGap = 8;
const cardPaddingX = 11;
const cardPaddingY = 10;
const cardRadius = 6;

const signerColumnRatios = [0.95, 0.85, 1.55];

const formatUtc = (date: Date) =>
  DateTime.fromJSDate(date).toUTC().setLocale(APP_I18N_OPTIONS.defaultLocale).toFormat("d LLL yyyy, HH:mm:ss 'UTC'");

const groupHash = (hex: string) => hex.match(/.{1,8}/g)?.join(' ') ?? hex;

const getDevice = (userAgent: string | null | undefined, unknown: string): string => {
  if (!userAgent) {
    return unknown;
  }

  const result = new UAParser(userAgent).getResult();

  const os = result.os.name;
  const browser = [result.browser.name, result.browser.major].filter(Boolean).join(' ');

  const parts = [os, browser].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : unknown;
};

const toImage = (data: Buffer | string) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return new SkiaImage(data) as unknown as HTMLImageElement;
};

/**
 * Small uppercase key label, e.g. "DOCUMENT NAME".
 */
const keyLabel = (text: string, config: Partial<Konva.TextConfig> = {}) =>
  new Konva.Text({
    text: text.toUpperCase(),
    fontFamily,
    fontSize: 7,
    fontStyle: '500',
    letterSpacing: 0.4,
    fill: colorSoft,
    ...config,
  });

const drawCheck = (x: number, y: number, size: number, stroke: string) =>
  new Konva.Line({
    points: [x, y + size * 0.55, x + size * 0.38, y + size * 0.9, x + size, y + size * 0.15],
    stroke,
    strokeWidth: 1.6,
    lineCap: 'round',
    lineJoin: 'round',
  });

type Block = {
  node: Konva.Group;
  height: number;
  gapBefore: number;
};

/* -------------------------------------------------------------------------- */
/*                                   Header                                   */
/* -------------------------------------------------------------------------- */

type RenderHeaderOptions = {
  width: number;
  envelopeId: string;
  isCompleted: boolean;
  hidePoweredBy: boolean;
  i18n: I18n;
};

const loadLogo = () => {
  try {
    const logoPath = path.join(process.cwd(), 'public/static/logo.png');

    return toImage(fs.readFileSync(logoPath));
  } catch {
    return null;
  }
};

const renderHeader = ({ width, envelopeId, isCompleted, hidePoweredBy, i18n }: RenderHeaderOptions) => {
  const group = new Konva.Group();

  let leftBottom = 0;

  if (!hidePoweredBy) {
    const logo = loadLogo();

    if (logo) {
      const logoHeight = 22;

      group.add(
        new Konva.Image({
          image: logo,
          x: 0,
          y: 2,
          height: logoHeight,
          width: logoHeight * (logo.width / logo.height),
        }),
      );

      leftBottom = logoHeight + 2;
    }
  }

  const title = new Konva.Text({
    x: 0,
    y: 0,
    width,
    align: 'right',
    text: i18n._(msg`Certificate of Completion`),
    fontFamily,
    fontSize: 17,
    fontStyle: '700',
    fill: colorInk,
  });
  group.add(title);

  const sub = new Konva.Text({
    x: 0,
    y: title.height() + 3,
    width,
    align: 'right',
    text: `${i18n._(msg`Envelope ID`)}: ${envelopeId}`,
    fontFamily,
    fontSize: 8.5,
    fill: colorMuted,
  });
  group.add(sub);

  let rightBottom = sub.y() + sub.height();

  if (isCompleted) {
    const pillText = new Konva.Text({
      text: i18n._(msg`Completed`),
      fontFamily,
      fontSize: 8.5,
      fontStyle: '600',
      fill: colorOk,
    });

    const pillPaddingX = 9;
    const iconSize = 7;
    const iconGap = 5;
    const pillHeight = 17;
    const pillWidth = pillPaddingX * 2 + iconSize + iconGap + pillText.width();
    const pillX = width - pillWidth;
    const pillY = rightBottom + 7;

    group.add(
      new Konva.Rect({
        x: pillX,
        y: pillY,
        width: pillWidth,
        height: pillHeight,
        fill: colorOkBg,
        cornerRadius: pillHeight / 2,
      }),
    );

    group.add(drawCheck(pillX + pillPaddingX, pillY + (pillHeight - iconSize) / 2, iconSize, colorOk));

    pillText.setAttrs({
      x: pillX + pillPaddingX + iconSize + iconGap,
      y: pillY + (pillHeight - pillText.height()) / 2,
    });
    group.add(pillText);

    rightBottom = pillY + pillHeight;
  }

  const ruleY = Math.max(leftBottom, rightBottom) + 10;

  group.add(
    new Konva.Line({
      points: [0, ruleY, width, ruleY],
      stroke: colorInk,
      strokeWidth: 2,
    }),
  );

  return { node: group, height: ruleY + 1 };
};

/* -------------------------------------------------------------------------- */
/*                               Section heading                              */
/* -------------------------------------------------------------------------- */

const renderSectionHeading = (text: string): Block => {
  const group = new Konva.Group();

  const heading = new Konva.Text({
    text: text.toUpperCase(),
    fontFamily,
    fontSize: 8.5,
    fontStyle: '600',
    letterSpacing: 0.7,
    fill: colorMuted,
  });
  group.add(heading);

  return { node: group, height: heading.height() + 7, gapBefore: sectionGap };
};

/* -------------------------------------------------------------------------- */
/*                               Document summary                             */
/* -------------------------------------------------------------------------- */

type SummaryCell = {
  label: string;
  value: string;
  subValue?: string;
  mono?: boolean;
  full?: boolean;
};

const summaryCellPaddingX = 11;
const summaryCellPaddingY = 7;

const renderSummaryCell = (cell: SummaryCell, width: number) => {
  const group = new Konva.Group();
  const innerWidth = width - summaryCellPaddingX * 2;

  const label = keyLabel(cell.label, { x: summaryCellPaddingX, y: summaryCellPaddingY, width: innerWidth });
  group.add(label);

  let y = summaryCellPaddingY + label.height() + 3;

  if (cell.subValue) {
    const sub = new Konva.Text({
      x: summaryCellPaddingX,
      y,
      width: innerWidth,
      text: cell.subValue,
      fontFamily,
      fontSize: 8.5,
      fontStyle: '500',
      fill: colorMuted,
      wrap: 'char',
    });
    group.add(sub);
    y += sub.height() + 2;
  }

  const value = new Konva.Text({
    x: summaryCellPaddingX,
    y,
    width: innerWidth,
    text: cell.value,
    fontFamily: cell.mono ? monoFontFamily : fontFamily,
    fontSize: cell.mono ? 8.5 : 9.5,
    fontStyle: cell.mono ? 'normal' : '500',
    fill: colorInk,
    wrap: cell.mono ? 'word' : 'char',
    lineHeight: 1.25,
  });
  group.add(value);

  y += value.height() + summaryCellPaddingY;

  return { node: group, height: y };
};

type RenderSummaryOptions = {
  width: number;
  i18n: I18n;
  envelopeTitle: string;
  envelopeStatus: DocumentStatus;
  envelopeOwner: { name: string; email: string };
  createdAt: Date;
  completedAt: Date | null;
  originalDocuments: OriginalDocumentDigest[];
};

const renderSummary = (options: RenderSummaryOptions): Block => {
  const { width, i18n, envelopeTitle, envelopeStatus, envelopeOwner, createdAt, completedAt, originalDocuments } =
    options;

  const halfCells: SummaryCell[] = [{ label: i18n._(msg`Document name`), value: envelopeTitle }];

  const pageCounts = originalDocuments.map((doc) => doc.pageCount);

  if (pageCounts.length > 0 && pageCounts.every((count): count is number => typeof count === 'number')) {
    halfCells.push({
      label: i18n._(msg`Pages`),
      value: String(pageCounts.reduce((sum, count) => sum + count, 0)),
    });
  }

  halfCells.push({ label: i18n._(msg`Created`), value: formatUtc(createdAt) });

  if (completedAt) {
    halfCells.push({
      label: envelopeStatus === DocumentStatus.REJECTED ? i18n._(msg`Rejected`) : i18n._(msg`Completed`),
      value: formatUtc(completedAt),
    });
  }

  halfCells.push({
    label: i18n._(msg`Sent by`),
    value: envelopeOwner.name ? `${envelopeOwner.name} · ${envelopeOwner.email}` : envelopeOwner.email,
  });

  // Pair half-width cells into rows; a trailing odd cell spans the full width.
  const rows: SummaryCell[][] = [];

  for (let i = 0; i < halfCells.length; i += 2) {
    const pair = halfCells.slice(i, i + 2);

    if (pair.length === 1) {
      pair[0].full = true;
    }

    rows.push(pair);
  }

  const isMultiDocument = originalDocuments.length > 1;

  for (const doc of originalDocuments) {
    rows.push([
      {
        label: i18n._(msg`Original document · SHA-256`),
        subValue: isMultiDocument ? doc.title : undefined,
        value: groupHash(doc.sha256),
        mono: true,
        full: true,
      },
    ]);
  }

  const group = new Konva.Group();
  const halfWidth = width / 2;

  let y = 0;

  for (const [rowIndex, row] of rows.entries()) {
    const renderedCells = row.map((cell, index) => {
      const cellWidth = cell.full ? width : halfWidth;
      const rendered = renderSummaryCell(cell, cellWidth);

      rendered.node.setAttrs({ x: index * halfWidth, y });

      return rendered;
    });

    const rowHeight = Math.max(...renderedCells.map((cell) => cell.height));

    renderedCells.forEach((cell) => group.add(cell.node));

    if (row.length === 2) {
      group.add(
        new Konva.Line({
          points: [halfWidth, y, halfWidth, y + rowHeight],
          stroke: colorLine,
          strokeWidth: 1,
        }),
      );
    }

    y += rowHeight;

    if (rowIndex < rows.length - 1) {
      group.add(
        new Konva.Line({
          points: [0, y, width, y],
          stroke: colorLine,
          strokeWidth: 1,
        }),
      );
    }
  }

  group.add(
    new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height: y,
      stroke: colorLine,
      strokeWidth: 1,
      cornerRadius: cardRadius,
    }),
  );

  return { node: group, height: y, gapBefore: 0 };
};

/* -------------------------------------------------------------------------- */
/*                                 Signer card                                */
/* -------------------------------------------------------------------------- */

type RenderSignerCardOptions = {
  recipient: CertificateRecipient;
  position: number;
  total: number;
  width: number;
  i18n: I18n;
};

const renderSignerIdentity = ({ recipient, position, total, width, i18n }: RenderSignerCardOptions) => {
  const group = new Konva.Group();

  let y = 0;

  if (recipient.name) {
    const name = new Konva.Text({
      y,
      width,
      text: recipient.name,
      fontFamily,
      fontSize: 10.5,
      fontStyle: '600',
      fill: colorInk,
      wrap: 'word',
    });
    group.add(name);
    y += name.height() + 2;
  }

  const email = new Konva.Text({
    y,
    width,
    text: recipient.email,
    fontFamily,
    fontSize: 8.5,
    fill: colorMuted,
    wrap: 'char',
  });
  group.add(email);
  y += email.height() + 6;

  const roleName = i18n._(RECIPIENT_ROLES_DESCRIPTION[recipient.role].roleName);

  const pillText = new Konva.Text({
    text: i18n._(msg`${roleName} · ${position} of ${total}`),
    fontFamily,
    fontSize: 7.5,
    fontStyle: '600',
    fill: colorBlue,
  });

  const pillPaddingX = 7;
  const pillHeight = 14;
  const pillWidth = Math.min(pillText.width() + pillPaddingX * 2, width);

  group.add(
    new Konva.Rect({
      x: 0,
      y,
      width: pillWidth,
      height: pillHeight,
      fill: colorIce,
      cornerRadius: pillHeight / 2,
    }),
  );

  pillText.setAttrs({ x: pillPaddingX, y: y + (pillHeight - pillText.height()) / 2 });
  group.add(pillText);

  y += pillHeight + 9;

  const authLabel = keyLabel(i18n._(msg`Authentication`), { y, width });
  group.add(authLabel);
  y += authLabel.height() + 2;

  const authValue = new Konva.Text({
    y,
    width,
    text: recipient.authLevel,
    fontFamily,
    fontSize: 8.5,
    fill: colorInk,
    wrap: 'word',
  });
  group.add(authValue);
  y += authValue.height();

  return { node: group, height: y };
};

const signatureBoxHeight = 44;

const renderSignerSignature = ({ recipient, width, i18n }: RenderSignerCardOptions) => {
  const group = new Konva.Group();

  const isRejected = Boolean(recipient.logs.rejected);
  const signature = recipient.signatureField?.signature;

  let y = 0;

  if (!recipient.signatureField?.secondaryId) {
    const na = new Konva.Text({
      y,
      width,
      text: i18n._(msg`No signature required`),
      fontFamily,
      fontSize: 8.5,
      fill: colorSoft,
    });
    group.add(na);

    return { node: group, height: na.height() };
  }

  if (!isRejected) {
    group.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width,
        height: signatureBoxHeight,
        fill: colorTint,
        stroke: colorLine,
        strokeWidth: 1,
        cornerRadius: 5,
      }),
    );

    const innerPadding = 4;
    const maxImageWidth = width - innerPadding * 2;
    const maxImageHeight = signatureBoxHeight - innerPadding * 2;

    if (signature?.signatureImageAsBase64) {
      const img = toImage(signature.signatureImageAsBase64);

      const scale = Math.min(maxImageWidth / img.width, maxImageHeight / img.height);
      const imageWidth = img.width * scale;
      const imageHeight = img.height * scale;

      group.add(
        new Konva.Image({
          image: img,
          x: (width - imageWidth) / 2,
          y: (signatureBoxHeight - imageHeight) / 2,
          width: imageWidth,
          height: imageHeight,
        }),
      );
    } else if (signature?.typedSignature) {
      group.add(
        new Konva.Text({
          x: innerPadding,
          y: 0,
          width: maxImageWidth,
          height: signatureBoxHeight,
          text: signature.typedSignature,
          fontFamily: getSignatureFontFamily(signature.typedSignature),
          fontSize: 16,
          fill: colorInk,
          align: 'center',
          verticalAlign: 'middle',
          wrap: 'none',
          ellipsis: true,
        }),
      );
    }

    y = signatureBoxHeight + 6;
  }

  const sigIdLabel = keyLabel(i18n._(msg`Signature ID`), { y, width });
  group.add(sigIdLabel);
  y += sigIdLabel.height() + 2;

  const sigIdValue = new Konva.Text({
    y,
    width,
    text: recipient.signatureField.secondaryId.toUpperCase(),
    fontFamily: monoFontFamily,
    fontSize: 8,
    fill: colorInk,
    wrap: 'char',
  });
  group.add(sigIdValue);
  y += sigIdValue.height();

  return { node: group, height: y };
};

const renderSignerDetails = ({ recipient, width, i18n }: RenderSignerCardOptions) => {
  const group = new Konva.Group();

  const unknown = i18n._(msg`Unknown`);

  const isRejected = Boolean(recipient.logs.rejected);
  const sentLog = recipient.logs.emailed ?? recipient.logs.sent;
  const relevantLog = isRejected ? recipient.logs.rejected : recipient.logs.completed;

  type DetailRow = { label: string; value: string; fill?: string };

  const rows: DetailRow[] = [
    { label: i18n._(msg`Sent`), value: sentLog ? formatUtc(sentLog.createdAt) : unknown },
    {
      label: i18n._(msg`Viewed`),
      value: recipient.logs.opened ? formatUtc(recipient.logs.opened.createdAt) : unknown,
    },
  ];

  if (recipient.logs.rejected) {
    rows.push({
      label: i18n._(msg`Rejected`),
      value: formatUtc(recipient.logs.rejected.createdAt),
      fill: colorRejected,
    });

    rows.push({
      label: i18n._(msg`Reason`),
      value: recipient.rejectionReason || '-',
      fill: colorRejected,
    });
  } else {
    rows.push({
      label: i18n._(msg`Signed`),
      value: recipient.logs.completed ? formatUtc(recipient.logs.completed.createdAt) : unknown,
    });
  }

  rows.push({ label: i18n._(msg`IP address`), value: relevantLog?.ipAddress ?? unknown });
  rows.push({ label: i18n._(msg`Device`), value: getDevice(relevantLog?.userAgent, unknown) });

  let y = 0;

  for (const row of rows) {
    const label = keyLabel(row.label, { y: y + 1, fill: row.fill ?? colorSoft });
    const valueX = label.width() + 10;

    const value = new Konva.Text({
      x: valueX,
      y,
      width: width - valueX,
      align: 'right',
      text: row.value,
      fontFamily,
      fontSize: 8.5,
      fill: row.fill ?? colorInk,
      wrap: 'word',
      lineHeight: 1.2,
    });

    group.add(label);
    group.add(value);

    y += Math.max(label.height(), value.height()) + 4;
  }

  y -= 4;

  const hasConsent = !isRejected && recipient.signingStatus === SigningStatus.SIGNED && recipient.logs.completed;

  if (hasConsent && recipient.logs.completed) {
    y += 7;

    group.add(
      new Konva.Line({
        points: [0, y, width, y],
        stroke: colorLine,
        strokeWidth: 1,
        dash: [3, 2],
      }),
    );

    y += 7;

    const iconSize = 7;

    const consentTitle = new Konva.Text({
      x: iconSize + 5,
      y,
      text: i18n._(msg`Consent recorded.`),
      fontFamily,
      fontSize: 8,
      fontStyle: '600',
      fill: colorOk,
    });

    group.add(drawCheck(0, y + (consentTitle.height() - iconSize) / 2, iconSize, colorOk));
    group.add(consentTitle);

    y += consentTitle.height() + 2;

    const signedAt = formatUtc(recipient.logs.completed.createdAt);

    const consentText = new Konva.Text({
      x: 0,
      y,
      width,
      text: i18n._(msg`Accepted the electronic signature disclosure when signing on ${signedAt}.`),
      fontFamily,
      fontSize: 8,
      fill: colorMuted,
      wrap: 'word',
      lineHeight: 1.25,
    });
    group.add(consentText);

    y += consentText.height();
  }

  return { node: group, height: y };
};

const renderSignerCard = (options: Omit<RenderSignerCardOptions, 'width'> & { width: number }): Block => {
  const { width } = options;

  const ratioSum = signerColumnRatios.reduce((sum, ratio) => sum + ratio, 0);
  const columnWidths = signerColumnRatios.map((ratio) => (width * ratio) / ratioSum);

  const renderers = [renderSignerIdentity, renderSignerSignature, renderSignerDetails];

  const card = new Konva.Group();

  let x = 0;
  let contentHeight = 0;

  const columns = renderers.map((render, index) => {
    const columnWidth = columnWidths[index];

    const rendered = render({ ...options, width: columnWidth - cardPaddingX * 2 });

    rendered.node.setAttrs({ x: x + cardPaddingX, y: cardPaddingY });
    contentHeight = Math.max(contentHeight, rendered.height);

    x += columnWidth;

    return rendered;
  });

  const height = contentHeight + cardPaddingY * 2;

  // Column separators.
  let separatorX = 0;

  for (const columnWidth of columnWidths.slice(0, -1)) {
    separatorX += columnWidth;

    card.add(
      new Konva.Line({
        points: [separatorX, 0, separatorX, height],
        stroke: colorLine,
        strokeWidth: 1,
      }),
    );
  }

  columns.forEach((column) => card.add(column.node));

  card.add(
    new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      stroke: colorLine,
      strokeWidth: 1,
      cornerRadius: cardRadius,
    }),
  );

  return { node: card, height, gapBefore: cardGap };
};

/* -------------------------------------------------------------------------- */
/*                                 Verify box                                 */
/* -------------------------------------------------------------------------- */

const renderVerifyBox = async ({ qrToken, width, i18n }: { qrToken: string; width: number; i18n: I18n }) => {
  const group = new Konva.Group();

  // Must stay identical to the URL encoded in the QR code.
  const verifyUrl = `${NEXT_PUBLIC_WEBAPP_URL()}/share/${qrToken}`;

  const padding = 11;
  const qrSize = 72;
  const gap = 14;

  const qrSvg = renderSVG(verifyUrl, { ecc: 'Q' });
  const qrPng = await svgToPng(qrSvg);

  const textX = padding + qrSize + gap;
  const textWidth = width - textX - padding;

  let y = padding;

  const title = new Konva.Text({
    x: textX,
    y,
    width: textWidth,
    text: i18n._(msg`Verify this document`),
    fontFamily,
    fontSize: 10,
    fontStyle: '600',
    fill: colorInk,
  });
  group.add(title);
  y += title.height() + 4;

  const body = new Konva.Text({
    x: textX,
    y,
    width: textWidth,
    text: i18n._(msg`Scan the code, or open the link below, to view the signed document and this certificate:`),
    fontFamily,
    fontSize: 8.5,
    fill: colorMuted,
    wrap: 'word',
    lineHeight: 1.25,
  });
  group.add(body);
  y += body.height() + 2;

  const link = new Konva.Text({
    x: textX,
    y,
    width: textWidth,
    text: verifyUrl,
    fontFamily,
    fontSize: 8.5,
    fontStyle: '500',
    fill: colorBlue,
    wrap: 'char',
    lineHeight: 1.25,
  });
  group.add(link);
  y += link.height() + 6;

  const seal = new Konva.Text({
    x: textX,
    y,
    width: textWidth,
    text: NEXT_PRIVATE_SIGNING_TIMESTAMP_AUTHORITY()
      ? i18n._(msg`Seal: PAdES digital signature with a trusted timestamp (RFC 3161)`)
      : i18n._(msg`Seal: PAdES digital signature`),
    fontFamily,
    fontSize: 7.5,
    fill: colorSoft,
    wrap: 'word',
  });
  group.add(seal);
  y += seal.height();

  const height = Math.max(y, qrSize) + padding;

  group.add(
    new Konva.Image({
      image: toImage(qrPng),
      x: padding,
      y: (height - qrSize) / 2,
      width: qrSize,
      height: qrSize,
    }),
  );

  group.add(
    new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      stroke: colorLine,
      strokeWidth: 1,
      cornerRadius: cardRadius,
    }),
  );

  return { node: group, height, gapBefore: sectionGap } satisfies Block;
};

/* -------------------------------------------------------------------------- */
/*                                   Footer                                   */
/* -------------------------------------------------------------------------- */

const renderFooter = ({
  width,
  envelopeId,
  hidePoweredBy,
  i18n,
}: {
  width: number;
  envelopeId: string;
  hidePoweredBy: boolean;
  i18n: I18n;
}) => {
  const group = new Konva.Group();

  group.add(
    new Konva.Line({
      points: [0, 0, width, 0],
      stroke: colorLine,
      strokeWidth: 1,
    }),
  );

  const idText = new Konva.Text({
    y: 6,
    text: envelopeId,
    fontFamily: monoFontFamily,
    fontSize: 7.5,
    fill: colorSoft,
  });
  idText.x(width - idText.width());

  const legal = hidePoweredBy
    ? i18n._(
        msg`Electronically signed. Simple electronic signatures under eIDAS (EU) and ESIGN/UETA (US). This PDF is digitally sealed: any change made after signing invalidates the seal.`,
      )
    : i18n._(
        msg`Electronically signed with Scriptia. Simple electronic signatures under eIDAS (EU) and ESIGN/UETA (US). This PDF is digitally sealed: any change made after signing invalidates the seal.`,
      );

  const legalText = new Konva.Text({
    x: 0,
    y: 6,
    width: Math.max(width - idText.width() - 24, width * 0.5),
    text: legal,
    fontFamily,
    fontSize: 7.5,
    fill: colorSoft,
    wrap: 'word',
    lineHeight: 1.3,
  });

  group.add(legalText);
  group.add(idText);

  return group;
};

/* -------------------------------------------------------------------------- */
/*                                   Render                                   */
/* -------------------------------------------------------------------------- */

export async function renderCertificate({
  recipients,
  envelopeId,
  envelopeTitle,
  envelopeStatus,
  createdAt,
  completedAt,
  originalDocuments,
  qrToken,
  hidePoweredBy,
  i18n,
  envelopeOwner,
  pageWidth,
  pageHeight,
}: GenerateCertificateOptions) {
  ensureFontLibrary();

  const contentWidth = Math.min(pageWidth - pageSideMargin * 2, contentMaxWidth);
  const marginX = (pageWidth - contentWidth) / 2;

  const isCompleted =
    envelopeStatus !== DocumentStatus.REJECTED &&
    recipients.length > 0 &&
    recipients.every(
      (recipient) => recipient.role === RecipientRoleEnum.CC || recipient.signingStatus === SigningStatus.SIGNED,
    );

  const headerOptions = { width: contentWidth, envelopeId, isCompleted, hidePoweredBy, i18n };
  const headerHeight = renderHeader(headerOptions).height;

  const contentTop = pageTopMargin + headerHeight;
  const contentBottom = pageHeight - footerReservedHeight;

  // Build every content block once, in order.
  const blocks: Block[] = [];

  blocks.push(renderSectionHeading(i18n._(msg`Document`)));
  blocks.push(
    renderSummary({
      width: contentWidth,
      i18n,
      envelopeTitle,
      envelopeStatus,
      envelopeOwner,
      createdAt,
      completedAt,
      originalDocuments,
    }),
  );

  blocks.push(renderSectionHeading(i18n._(msg`Signers`)));

  for (const [index, recipient] of recipients.entries()) {
    const card = renderSignerCard({
      recipient,
      position: index + 1,
      total: recipients.length,
      width: contentWidth,
      i18n,
    });

    // The first card follows its heading directly.
    if (index === 0) {
      card.gapBefore = 0;
    }

    blocks.push(card);
  }

  if (qrToken) {
    blocks.push(await renderVerifyBox({ qrToken, width: contentWidth, i18n }));
  }

  // Distribute blocks over pages. A section heading is kept with the block after it.
  const pagesLayout: Array<Array<{ block: Block; y: number }>> = [[]];

  let cursorY = contentTop;

  for (const [index, block] of blocks.entries()) {
    const currentPage = pagesLayout[pagesLayout.length - 1];
    const isPageEmpty = currentPage.length === 0;

    const gap = isPageEmpty ? (index === 0 ? sectionGap : 14) : block.gapBefore;

    let requiredHeight = gap + block.height;

    const isHeading = block.gapBefore === sectionGap && blocks[index + 1]?.gapBefore === 0;

    if (isHeading && blocks[index + 1]) {
      requiredHeight += blocks[index + 1].height;
    }

    if (!isPageEmpty && cursorY + requiredHeight > contentBottom) {
      pagesLayout.push([]);
      cursorY = contentTop;

      const nextGap = 14;

      pagesLayout[pagesLayout.length - 1].push({ block, y: cursorY + nextGap });
      cursorY += nextGap + block.height;

      continue;
    }

    currentPage.push({ block, y: cursorY + gap });
    cursorY += gap + block.height;
  }

  let stage: Konva.Stage | null = new Konva.Stage({ width: pageWidth, height: pageHeight });

  const pages: Uint8Array[] = [];

  for (const pageBlocks of pagesLayout) {
    stage.destroyChildren();

    const page = new Konva.Layer();

    page.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        fill: '#FFFFFF',
      }),
    );

    const header = renderHeader(headerOptions).node;
    header.setAttrs({ x: marginX, y: pageTopMargin });
    page.add(header);

    for (const { block, y } of pageBlocks) {
      block.node.setAttrs({ x: marginX, y });
      page.add(block.node);
    }

    const footer = renderFooter({ width: contentWidth, envelopeId, hidePoweredBy, i18n });
    footer.setAttrs({ x: marginX, y: pageHeight - footerReservedHeight + 16 });
    page.add(footer);

    stage.add(page);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const canvas = page.canvas._canvas as unknown as Canvas;
    const buffer = await canvas.toBuffer('pdf');
    pages.push(new Uint8Array(buffer));
  }

  stage.destroy();
  stage = null;

  return pages;
}
