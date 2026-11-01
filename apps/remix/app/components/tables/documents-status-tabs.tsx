import { useOptionalCurrentOrganisation } from '@documenso/lib/client-only/providers/organisation';
import { STATS_COUNT_CAP } from '@documenso/lib/constants/document';
import { ExtendedDocumentStatus } from '@documenso/prisma/types/extended-document-status';
import type { TFindDocumentsInternalResponse } from '@documenso/trpc/server/document-router/find-documents-internal.types';
import { cn } from '@documenso/ui/lib/utils';
import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { OrganisationType } from '@prisma/client';
import { useQueryStates } from 'nuqs';
import { Link } from 'react-router';

import { documentsSearchParams } from '~/utils/documents-search-params';

type Tab = {
  status: ExtendedDocumentStatus;
  label: MessageDescriptor;
};

const TABS: Tab[] = [
  { status: ExtendedDocumentStatus.INBOX, label: msg`To sign` },
  { status: ExtendedDocumentStatus.PENDING, label: msg`Waiting for others` },
  { status: ExtendedDocumentStatus.COMPLETED, label: msg`Completed` },
  { status: ExtendedDocumentStatus.DRAFT, label: msg`Drafts` },
  { status: ExtendedDocumentStatus.ALL, label: msg`All` },
];

const tabClassName = (isActive: boolean) =>
  cn(
    'inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 font-medium text-sm',
    'transition-colors duration-150 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
  );

const formatCount = (count: number) => (count >= STATS_COUNT_CAP ? `${STATS_COUNT_CAP.toLocaleString()}+` : count);

export type DocumentsStatusTabsProps = {
  stats: TFindDocumentsInternalResponse['stats'];
};

/**
 * Scriptia: the main document views as plain tabs instead of a status dropdown.
 *
 * Personal accounts have no team inbox, so "To sign" points to the personal inbox.
 */
export const DocumentsStatusTabs = ({ stats }: DocumentsStatusTabsProps) => {
  const { _ } = useLingui();

  const organisation = useOptionalCurrentOrganisation();
  const isPersonal = organisation?.type === OrganisationType.PERSONAL;

  const [{ status }, setSearchParams] = useQueryStates(
    {
      status: documentsSearchParams.status,
      page: documentsSearchParams.page,
    },
    { history: 'push' },
  );

  const activeStatus = status ?? ExtendedDocumentStatus.ALL;

  return (
    <nav
      aria-label={_(msg`Document views`)}
      className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0"
      data-testid="documents-status-tabs"
    >
      <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((tab) => {
          const isActive = activeStatus === tab.status;
          const count = stats[tab.status];

          if (tab.status === ExtendedDocumentStatus.INBOX && isPersonal) {
            return (
              <Link key={tab.status} to="/inbox" className={tabClassName(false)}>
                {_(tab.label)}
              </Link>
            );
          }

          return (
            <button
              key={tab.status}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              className={tabClassName(isActive)}
              onClick={() =>
                void setSearchParams({
                  status: tab.status === ExtendedDocumentStatus.ALL ? null : tab.status,
                  page: null,
                })
              }
            >
              {_(tab.label)}

              {count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs tabular-nums',
                    isActive ? 'bg-primary/10 text-primary' : 'bg-background/60 text-muted-foreground',
                  )}
                >
                  {formatCount(count)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
