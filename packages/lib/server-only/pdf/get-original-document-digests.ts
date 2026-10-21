import { createHash } from 'node:crypto';

import { PDF } from '@libpdf/core';
import type { DocumentData } from '@prisma/client';

import { getFileServerSide } from '../../universal/upload/get-file.server';

export type OriginalDocumentDigest = {
  title: string;
  /**
   * Lowercase hex SHA-256 of the original uploaded PDF bytes (documentData.initialData).
   */
  sha256: string;
  pageCount: number | null;
};

type GetOriginalDocumentDigestsOptions = {
  envelopeItems: Array<{
    title: string;
    documentData: Pick<DocumentData, 'type' | 'data' | 'initialData'>;
    /**
     * Bytes already fetched for `documentData.data`. Reused when `data` and
     * `initialData` point to the same content, to avoid a second fetch.
     */
    prefetchedData?: Uint8Array;
  }>;
};

export const sha256Hex = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

/**
 * Hash the ORIGINAL uploaded PDF of every envelope item, for display on the
 * certificate of completion. Never the sealed output (it cannot contain itself).
 */
export const getOriginalDocumentDigests = async ({
  envelopeItems,
}: GetOriginalDocumentDigestsOptions): Promise<OriginalDocumentDigest[]> => {
  return await Promise.all(
    envelopeItems.map(async (item) => {
      const { documentData, prefetchedData } = item;

      const originalBytes =
        prefetchedData && documentData.data === documentData.initialData
          ? prefetchedData
          : await getFileServerSide({ type: documentData.type, data: documentData.initialData });

      let pageCount: number | null = null;

      try {
        const pdf = await PDF.load(originalBytes);
        pageCount = pdf.getPageCount();
      } catch {
        pageCount = null;
      }

      return {
        title: item.title,
        sha256: sha256Hex(originalBytes),
        pageCount,
      };
    }),
  );
};
