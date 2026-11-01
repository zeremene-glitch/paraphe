import { useLimits } from '@documenso/ee/server-only/limits/provider/client';
import { useAnalytics } from '@documenso/lib/client-only/hooks/use-analytics';
import { useCurrentOrganisation } from '@documenso/lib/client-only/providers/organisation';
import { useSession } from '@documenso/lib/client-only/providers/session';
import { TIME_ZONES } from '@documenso/lib/constants/time-zones';
import { AppError } from '@documenso/lib/errors/app-error';
import { formatDocumentsPath, formatTemplatesPath } from '@documenso/lib/utils/teams';
import { trpc } from '@documenso/trpc/react';
import type { TCreateEnvelopePayload } from '@documenso/trpc/server/envelope-router/create-envelope.types';
import { buildDropzoneRejectionDescription } from '@documenso/ui/lib/handle-dropzone-rejection';
import { cn } from '@documenso/ui/lib/utils';
import { DocumentUploadButton } from '@documenso/ui/primitives/document-upload-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@documenso/ui/primitives/tooltip';
import { useToast } from '@documenso/ui/primitives/use-toast';
import { msg, plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { EnvelopeType, RecipientRole } from '@prisma/client';
import { useMemo, useState } from 'react';
import { ErrorCode as DropzoneErrorCode, type FileRejection } from 'react-dropzone';
import { useNavigate } from 'react-router';

import { useCurrentTeam } from '~/providers/team';
import { getUploadErrorMessage } from '~/utils/toast-error-messages';

export type EnvelopeUploadButtonProps = {
  className?: string;
  type: EnvelopeType;
  folderId?: string;
};

/**
 * Scriptia upload modes:
 * - `send`: upload and open the editor to add signers (the upstream flow).
 * - `self`: "Just me". The user is the only signer, fields are placed for them,
 *   nothing is emailed, and they land straight on the signing page.
 */
export type EnvelopeUploadMode = 'send' | 'self';

export type UseEnvelopeUploadOptions = {
  type: EnvelopeType;
  folderId?: string;
  mode?: EnvelopeUploadMode;
};

export const useEnvelopeUpload = ({ type, folderId, mode = 'send' }: UseEnvelopeUploadOptions) => {
  const { t, i18n } = useLingui();
  const { toast } = useToast();
  const { user } = useSession();
  const analytics = useAnalytics();

  const team = useCurrentTeam();

  const navigate = useNavigate();
  const organisation = useCurrentOrganisation();

  const userTimezone = TIME_ZONES.find((timezone) => timezone === Intl.DateTimeFormat().resolvedOptions().timeZone);

  const { quota, remaining, refreshLimits, maximumEnvelopeItemCount } = useLimits();

  const [isLoading, setIsLoading] = useState(false);

  const { mutateAsync: createEnvelope } = trpc.envelope.create.useMutation();
  const { mutateAsync: autoPlaceFields } = trpc.envelope.autoPlaceFields.useMutation();
  const { mutateAsync: distributeEnvelope } = trpc.envelope.distribute.useMutation();

  const isSelfSign = mode === 'self' && type === EnvelopeType.DOCUMENT;

  const disabledMessage = useMemo(() => {
    if (organisation.subscription && remaining.documents === 0) {
      return msg`Document upload disabled due to unpaid invoices`;
    }

    if (remaining.documents === 0) {
      return msg`You have reached your document limit.`;
    }

    if (!user.emailVerified) {
      return msg`Verify your email to upload documents.`;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining.documents, user.emailVerified, team]);

  const onFileDrop = async (files: File[]) => {
    try {
      setIsLoading(true);

      const payload = {
        folderId,
        type,
        title: files[0].name,
        meta: {
          timezone: userTimezone,
          ...(isSelfSign ? { distributionMethod: 'NONE' as const } : {}),
        },
        recipients: isSelfSign
          ? [{ email: user.email, name: user.name ?? '', role: RecipientRole.SIGNER, signingOrder: 1 }]
          : undefined,
      } satisfies TCreateEnvelopePayload;

      const formData = new FormData();

      formData.append('payload', JSON.stringify(payload));

      for (const file of files) {
        formData.append('files', file);
      }

      const { id } = await createEnvelope(formData).catch((error) => {
        console.error(error);

        throw error;
      });

      void refreshLimits();

      if (isSelfSign) {
        await autoPlaceFields({ envelopeId: id });

        const { recipients } = await distributeEnvelope({
          envelopeId: id,
          meta: { distributionMethod: 'NONE' },
        });

        const self = recipients.find((recipient) => recipient.email === user.email) ?? recipients[0];

        await navigate(`/sign/${self.token}`);

        return;
      }

      const pathPrefix = type === EnvelopeType.DOCUMENT ? formatDocumentsPath(team.url) : formatTemplatesPath(team.url);

      const aiQueryParam = team.preferences.aiFeaturesEnabled ? '?ai=true' : '';

      await navigate(`${pathPrefix}/${id}/edit${aiQueryParam}`);

      toast({
        title: type === EnvelopeType.DOCUMENT ? t`Document uploaded` : t`Template uploaded`,
        description:
          type === EnvelopeType.DOCUMENT
            ? t`Your document has been uploaded successfully.`
            : t`Your template has been uploaded successfully.`,
        duration: 5000,
      });
    } catch (err) {
      const error = AppError.parseError(err);

      console.error(err);

      analytics.captureException(err, {
        source: 'editor',
        location: 'upload_document',
      });

      const errorMessage = getUploadErrorMessage(error.code);

      toast({
        title: i18n._(errorMessage.title),
        description: i18n._(errorMessage.description),
        variant: 'destructive',
        duration: 7500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onFileDropRejected = (fileRejections: FileRejection[]) => {
    const maxItemsReached = fileRejections.some((fileRejection) =>
      fileRejection.errors.some((error) => error.code === DropzoneErrorCode.TooManyFiles),
    );

    if (maxItemsReached) {
      toast({
        title: plural(maximumEnvelopeItemCount, {
          one: `You cannot upload more than # item per envelope.`,
          other: `You cannot upload more than # items per envelope.`,
        }),
        duration: 5000,
        variant: 'destructive',
      });

      return;
    }

    toast({
      title: t`Upload failed`,
      description: i18n._(buildDropzoneRejectionDescription(fileRejections)),
      duration: 5000,
      variant: 'destructive',
    });
  };

  return {
    isLoading,
    disabled: remaining.documents === 0 || !user.emailVerified,
    disabledMessage,
    maximumEnvelopeItemCount,
    remaining,
    quota,
    onFileDrop,
    onFileDropRejected,
  };
};

/**
 * Upload an envelope
 */
export const EnvelopeUploadButton = ({ className, type, folderId }: EnvelopeUploadButtonProps) => {
  const {
    isLoading,
    disabled,
    disabledMessage,
    maximumEnvelopeItemCount,
    remaining,
    quota,
    onFileDrop,
    onFileDropRejected,
  } = useEnvelopeUpload({ type, folderId });

  return (
    <div className={cn('relative', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <DocumentUploadButton
                loading={isLoading}
                disabled={disabled}
                disabledMessage={disabledMessage}
                onDrop={onFileDrop}
                onDropRejected={onFileDropRejected}
                type={type}
                internalVersion="2"
                maxFiles={maximumEnvelopeItemCount}
              />
            </div>
          </TooltipTrigger>

          {type === EnvelopeType.DOCUMENT && remaining.documents > 0 && Number.isFinite(remaining.documents) && (
            <TooltipContent>
              <p className="text-sm">
                <Trans>
                  {remaining.documents} of {quota.documents} documents remaining this month.
                </Trans>
              </p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
