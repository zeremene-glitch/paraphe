import { type TFieldAndMeta, ZEnvelopeFieldAndMetaSchema } from '@documenso/lib/types/field-meta';
import { PDF, rgb } from '@libpdf/core';
import type { FieldType, Recipient } from '@prisma/client';

import { parseFieldMetaFromPlaceholder, parseFieldTypeFromPlaceholder } from './helpers';

const PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g;
const DEFAULT_FIELD_HEIGHT_PERCENT = 2;
const MIN_HEIGHT_THRESHOLD = 0.01;

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Draw white rectangles over specified regions in a loaded PDF document.
 *
 * Mutates the PDF in place. Coordinates use bottom-left origin (standard PDF coordinates).
 */
export const whiteoutRegions = (pdfDoc: PDF, regions: Array<{ pageIndex: number; bbox: BoundingBox }>): void => {
  const pages = pdfDoc.getPages();

  for (const { pageIndex, bbox } of regions) {
    const page = pages[pageIndex];

    page.drawRectangle({
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
      color: rgb(1, 1, 1),
      borderColor: rgb(1, 1, 1),
      borderWidth: 2,
    });
  }
};

export type PlaceholderInfo = {
  placeholder: string;
  recipient: string;
  fieldAndMeta: TFieldAndMeta;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  pageWidth: number;
  pageHeight: number;
};

export type FieldToCreate = TFieldAndMeta & {
  envelopeItemId?: string;
  recipientId: number;
  page: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
};

export const extractPlaceholdersFromPDF = async (pdf: Buffer): Promise<PlaceholderInfo[]> => {
  const pdfDoc = await PDF.load(new Uint8Array(pdf));

  const placeholders: PlaceholderInfo[] = [];

  for (const page of pdfDoc.getPages()) {
    const pageWidth = page.width;
    const pageHeight = page.height;

    const matches = page.findText(PLACEHOLDER_REGEX);

    for (const match of matches) {
      const placeholder = match.text;

      /*
        Extract the inner content from the placeholder match.
        E.g. '{{SIGNATURE, r1, required=true}}' -> 'SIGNATURE, r1, required=true'
      */
      const innerMatch = placeholder.match(/^\{\{([^}]+)\}\}$/);

      if (!innerMatch) {
        continue;
      }

      const placeholderData = innerMatch[1].split(',').map((property) => property.trim());
      const [fieldTypeString, recipientOrMeta, ...fieldMetaData] = placeholderData;

      let fieldType: FieldType;

      try {
        fieldType = parseFieldTypeFromPlaceholder(fieldTypeString);
      } catch {
        // Skip placeholders with unrecognized field types.
        continue;
      }

      /*
        A recipient identifier (e.g. "r1", "R2") is required for auto-placement.
        Placeholders without an explicit recipient like {{name}} are reserved for
        future API use where callers can reference a placeholder by name with
        optional dimensions instead of absolute coordinates.
      */
      if (!recipientOrMeta || !/^r\d+$/i.test(recipientOrMeta)) {
        continue;
      }

      const recipient = recipientOrMeta;

      const rawFieldMeta = Object.fromEntries(fieldMetaData.map((property) => property.split('=')));

      const parsedFieldMeta = parseFieldMetaFromPlaceholder(rawFieldMeta, fieldType);

      const fieldAndMeta: TFieldAndMeta = ZEnvelopeFieldAndMetaSchema.parse({
        type: fieldType,
        fieldMeta: parsedFieldMeta,
      });

      /*
        LibPDF returns bbox in points with bottom-left origin.
        Convert Y to top-left origin for consistency with the rest of the system.
      */
      const topLeftY = pageHeight - match.bbox.y - match.bbox.height;

      placeholders.push({
        placeholder,
        recipient,
        fieldAndMeta,
        page: page.index + 1,
        x: match.bbox.x,
        y: topLeftY,
        width: match.bbox.width,
        height: match.bbox.height,
        pageWidth,
        pageHeight,
      });
    }
  }

  return placeholders;
};

/**
 * Draw white rectangles over placeholder text in a PDF.
 *
 * Accepts optional pre-extracted placeholders to avoid re-parsing the PDF.
 */
export const removePlaceholdersFromPDF = async (pdf: Buffer, placeholders?: PlaceholderInfo[]): Promise<Buffer> => {
  const resolved = placeholders ?? (await extractPlaceholdersFromPDF(pdf));

  const pdfDoc = await PDF.load(new Uint8Array(pdf));
  const pages = pdfDoc.getPages();

  /*
    Convert PlaceholderInfo[] to whiteout regions.
    PlaceholderInfo uses top-left origin, but whiteoutRegions expects bottom-left.
  */
  const regions = resolved.map((p) => {
    const page = pages[p.page - 1];
    const bottomLeftY = page.height - p.y - p.height;

    return {
      pageIndex: p.page - 1,
      bbox: { x: p.x, y: bottomLeftY, width: p.width, height: p.height },
    };
  });

  whiteoutRegions(pdfDoc, regions);

  const modifiedPdfBytes = await pdfDoc.save();

  return Buffer.from(modifiedPdfBytes);
};

/**
 * Extract placeholders from a PDF and remove them from the document.
 *
 * Returns the cleaned PDF buffer and the extracted placeholders. If no
 * placeholders are found the original buffer is returned as-is.
 */
export const extractPdfPlaceholders = async (
  pdf: Buffer,
): Promise<{ cleanedPdf: Buffer; placeholders: PlaceholderInfo[] }> => {
  const placeholders = await extractPlaceholdersFromPDF(pdf);

  if (placeholders.length === 0) {
    return { cleanedPdf: pdf, placeholders: [] };
  }

  const cleanedPdf = await removePlaceholdersFromPDF(pdf, placeholders);

  return { cleanedPdf, placeholders };
};

const ROW_TOLERANCE = 2;
const MAX_ROW_PITCH = 80;
const COLUMN_GAP = 6;
const ROW_GAP = 8;
const MAX_FIELD_HEIGHT = 60;
const MAX_LONE_WIDTH = 180;

/**
 * Scriptia: grow each placeholder from the size of its text to the space it sits in.
 *
 * Placeholders on the same line are treated as table columns: a field stretches to the
 * next placeholder on its right, and down to the next row of placeholders. A placeholder
 * with no neighbours gets a sensible minimum size for its field type.
 */
export const fitPlaceholdersToLayout = (placeholders: PlaceholderInfo[]): PlaceholderInfo[] => {
  const byPage = new Map<number, PlaceholderInfo[]>();

  for (const p of placeholders) {
    byPage.set(p.page, [...(byPage.get(p.page) ?? []), p]);
  }

  const fitted = new Map<PlaceholderInfo, PlaceholderInfo>();

  for (const pagePlaceholders of byPage.values()) {
    const minX = Math.min(...pagePlaceholders.map((p) => p.x));

    // Group into rows by their top edge.
    const rows: PlaceholderInfo[][] = [];

    for (const p of [...pagePlaceholders].sort((a, b) => a.y - b.y)) {
      const row = rows.find((r) => Math.abs(r[0].y - p.y) <= ROW_TOLERANCE);

      if (row) {
        row.push(p);
      } else {
        rows.push([p]);
      }
    }

    rows.forEach((row, rowIndex) => {
      const below = rows[rowIndex + 1]?.[0].y - row[0].y;
      const above = row[0].y - rows[rowIndex - 1]?.[0].y;
      const pitch = [below, above].find((d) => d > 0 && d <= MAX_ROW_PITCH);

      row.sort((a, b) => a.x - b.x);

      row.forEach((p, columnIndex) => {
        const next = row[columnIndex + 1];
        const isSignature = p.fieldAndMeta.type === 'SIGNATURE' || p.fieldAndMeta.type === 'FREE_SIGNATURE';

        const width = next
          ? next.x - p.x - COLUMN_GAP
          : Math.min(p.pageWidth - minX - p.x, row.length > 1 ? Infinity : MAX_LONE_WIDTH);

        const height = pitch ? Math.min(pitch - ROW_GAP, MAX_FIELD_HEIGHT) : isSignature ? 36 : 16;

        fitted.set(p, {
          ...p,
          x: p.x - 2,
          y: p.y - 3,
          width: Math.max(p.width, width),
          height: Math.max(p.height, height),
        });
      });
    });
  }

  return placeholders.map((p) => fitted.get(p) ?? p);
};

/**
 * Convert pre-extracted PlaceholderInfo[] to field creation inputs.
 *
 * Pure data transform — converts point-based coordinates to percentages and
 * resolves recipient references via the provided callback. No DB calls.
 */
export const convertPlaceholdersToFieldInputs = (
  placeholders: PlaceholderInfo[],
  recipientResolver: (recipientPlaceholder: string, placeholder: string) => Pick<Recipient, 'id'>,
  envelopeItemId?: string,
): FieldToCreate[] => {
  return fitPlaceholdersToLayout(placeholders).map((p) => {
    const xPercent = (p.x / p.pageWidth) * 100;
    const yPercent = (p.y / p.pageHeight) * 100;
    const widthPercent = (p.width / p.pageWidth) * 100;
    const heightPercent = (p.height / p.pageHeight) * 100;

    const finalHeightPercent = heightPercent > MIN_HEIGHT_THRESHOLD ? heightPercent : DEFAULT_FIELD_HEIGHT_PERCENT;

    const recipient = recipientResolver(p.recipient, p.placeholder);

    return {
      ...p.fieldAndMeta,
      envelopeItemId,
      recipientId: recipient.id,
      page: p.page,
      positionX: xPercent,
      positionY: yPercent,
      width: widthPercent,
      height: finalHeightPercent,
    };
  });
};
