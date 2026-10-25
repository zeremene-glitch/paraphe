import { formatDocumentsPath } from '@documenso/lib/utils/teams';
import { trpc } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { Spinner } from '@documenso/ui/primitives/spinner';
import { Trans } from '@lingui/react/macro';
import { DocumentSigningOrder, DocumentStatus, RecipientRole, SigningStatus } from '@prisma/client';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock8, XCircle } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router';

import { GenericErrorLayout } from '~/components/general/generic-error-layout';
import { useCurrentTeam } from '~/providers/team';
import { clearSignOnDeviceReturnPath, setSignOnDeviceReturnPath } from '~/utils/sign-on-device';

export function meta() {
  return [{ title: 'Sign on this device - Scriptia' }];
}

/**
 * Scriptia: one shared tablet, several signers. Each person taps their name, signs, and the
 * signing complete page brings the tablet back here.
 */
export default function SignOnDevicePage() {
  const params = useParams();
  const team = useCurrentTeam();
  const location = useLocation();

  const { data: envelope, isLoading } = trpc.envelope.get.useQuery(
    { envelopeId: params.id ?? '' },
    { enabled: !!params.id, refetchInterval: 5000, refetchOnWindowFocus: true },
  );

  if (isLoading) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-2 py-64 text-foreground">
        <Spinner />
        <Trans>Loading</Trans>
      </div>
    );
  }

  if (!envelope) {
    return <GenericErrorLayout errorCode={404} />;
  }

  const documentPath = `${formatDocumentsPath(team.url)}/${envelope.id}`;

  const signers = envelope.recipients
    .filter((recipient) => recipient.role !== RecipientRole.CC)
    .sort((a, b) => (a.signingOrder ?? 0) - (b.signingOrder ?? 0) || a.id - b.id);

  const isSequential = envelope.documentMeta?.signingOrder === DocumentSigningOrder.SEQUENTIAL;
  const nextInOrder = signers.find((recipient) => recipient.signingStatus === SigningStatus.NOT_SIGNED);

  const pendingCount = signers.filter((recipient) => recipient.signingStatus === SigningStatus.NOT_SIGNED).length;

  const openSigning = (token: string) => {
    setSignOnDeviceReturnPath(location.pathname);
    window.location.assign(`/sign/${token}`);
  };

  return (
    <div className="mx-auto -mt-4 w-full max-w-2xl px-4 md:px-8">
      <Link
        to={documentPath}
        onClick={clearSignOnDeviceReturnPath}
        className="flex items-center text-documenso-700 hover:opacity-80"
      >
        <ChevronLeft className="mr-2 inline-block h-5 w-5" />
        <Trans>Back to document</Trans>
      </Link>

      <h1 className="mt-4 font-semibold text-2xl md:text-3xl">
        <Trans>Sign on this device</Trans>
      </h1>
      <p className="mt-2 truncate text-muted-foreground" title={envelope.title}>
        {envelope.title}
      </p>

      {envelope.status === DocumentStatus.COMPLETED ? (
        <div className="mt-8 flex items-center gap-3 rounded-lg border border-green-600/30 bg-green-600/10 p-5 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <p className="font-medium">
            <Trans>Everyone has signed. Each person will receive the signed document by email.</Trans>
          </p>
        </div>
      ) : envelope.status !== DocumentStatus.PENDING ? (
        <p className="mt-8 rounded-lg border p-5 text-muted-foreground">
          <Trans>This document is not waiting for signatures. Send it first, then come back to this page.</Trans>
        </p>
      ) : (
        <p className="mt-6 text-muted-foreground text-sm">
          <Trans>
            Tap your name to sign. When you finish, this tablet comes back to this list for the next person.
          </Trans>{' '}
          <span className="font-medium text-foreground tabular-nums">
            <Trans>{pendingCount} still to sign.</Trans>
          </span>
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {signers.map((recipient) => {
          const isSigned = recipient.signingStatus === SigningStatus.SIGNED;
          const isRejected = recipient.signingStatus === SigningStatus.REJECTED;
          const isWaitingTurn = isSequential && !isSigned && !isRejected && recipient.id !== nextInOrder?.id;
          const canSign = envelope.status === DocumentStatus.PENDING && !isSigned && !isRejected && !isWaitingTurn;

          return (
            <li key={recipient.id}>
              <button
                type="button"
                disabled={!canSign}
                onClick={() => openSigning(recipient.token)}
                className={cn(
                  'flex min-h-[72px] w-full items-center gap-4 rounded-xl border bg-background px-5 py-4 text-left transition-[transform,background-color,border-color] duration-150 ease-out',
                  canSign && 'hover:border-primary hover:bg-primary/5 active:scale-[0.98]',
                  !canSign && 'cursor-default opacity-60',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-lg">{recipient.name || recipient.email}</p>
                  {recipient.name && <p className="truncate text-muted-foreground text-sm">{recipient.email}</p>}
                </div>

                {isSigned && (
                  <span className="flex items-center gap-1.5 font-medium text-green-700 text-sm dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <Trans>Signed</Trans>
                  </span>
                )}

                {isRejected && (
                  <span className="flex items-center gap-1.5 font-medium text-destructive text-sm">
                    <XCircle className="h-5 w-5" />
                    <Trans>Rejected</Trans>
                  </span>
                )}

                {isWaitingTurn && (
                  <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <Clock8 className="h-5 w-5" />
                    <Trans>Waiting for turn</Trans>
                  </span>
                )}

                {canSign && <ChevronRight className="h-6 w-6 text-muted-foreground" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
