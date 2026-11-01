import { APP_DOCUMENT_UPLOAD_SIZE_LIMIT } from '@documenso/lib/constants/app';
import { getAllowedUploadMimeTypes } from '@documenso/lib/constants/document-conversion';
import { PARAPHE_FEATURES } from '@documenso/lib/constants/paraphe';
import { megabytesToBytes } from '@documenso/lib/universal/unit-convertions';
import { formatTemplatesPath } from '@documenso/lib/utils/teams';
import { cn } from '@documenso/ui/lib/utils';
import { Trans, useLingui } from '@lingui/react/macro';
import { EnvelopeType } from '@prisma/client';
import { LayoutTemplateIcon, Loader2Icon, type LucideIcon, PenLineIcon, SendIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link } from 'react-router';

import { useCurrentTeam } from '~/providers/team';

import { type EnvelopeUploadMode, useEnvelopeUpload } from './envelope-upload-button';

const choiceClassName = cn(
  'group flex w-full items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-left',
  'transition-[background-color,border-color] duration-150 ease-out',
  'hover:border-primary/40 hover:bg-primary/5',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
);

type ChoiceBodyProps = {
  icon: LucideIcon;
  loading?: boolean;
  title: ReactNode;
  hint: ReactNode;
};

const ChoiceBody = ({ icon: Icon, loading, title, hint }: ChoiceBodyProps) => (
  <>
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
      {loading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
    </span>

    <span className="min-w-0">
      <span className="block font-medium text-foreground text-sm">{title}</span>
      <span className="block text-muted-foreground text-xs">{hint}</span>
    </span>
  </>
);

type UploadChoiceProps = {
  mode: EnvelopeUploadMode;
  folderId?: string;
  icon: LucideIcon;
  title: ReactNode;
  hint: ReactNode;
  testId: string;
};

const UploadChoice = ({ mode, folderId, icon, title, hint, testId }: UploadChoiceProps) => {
  const { t, i18n } = useLingui();

  const { isLoading, disabled, disabledMessage, maximumEnvelopeItemCount, onFileDrop, onFileDropRejected } =
    useEnvelopeUpload({ type: EnvelopeType.DOCUMENT, folderId, mode });

  const isDisabled = disabled || isLoading;

  const { getRootProps, getInputProps } = useDropzone({
    accept: getAllowedUploadMimeTypes(),
    // "Just me" signs one file; sending can bundle several.
    multiple: mode === 'send',
    maxFiles: mode === 'self' ? 1 : maximumEnvelopeItemCount,
    disabled: isDisabled,
    maxSize: megabytesToBytes(APP_DOCUMENT_UPLOAD_SIZE_LIMIT),
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        void onFileDrop(acceptedFiles);
      }
    },
    onDropRejected: onFileDropRejected,
  });

  return (
    <div
      {...getRootProps()}
      role="button"
      aria-disabled={isDisabled}
      title={disabled && disabledMessage ? i18n._(disabledMessage) : t`Choose a file, or drop it here`}
      className={choiceClassName}
      data-testid={testId}
    >
      <input {...getInputProps()} />
      <ChoiceBody icon={icon} loading={isLoading} title={title} hint={hint} />
    </div>
  );
};

export type DocumentStartChoicesProps = {
  folderId?: string;
};

/**
 * Scriptia: the three ways to start, shown at the top of the documents page.
 */
export const DocumentStartChoices = ({ folderId }: DocumentStartChoicesProps) => {
  const team = useCurrentTeam();

  return (
    <section aria-labelledby="start-choices-heading" className="mt-8">
      <h3 id="start-choices-heading" className="mb-3 font-semibold text-base text-foreground">
        <Trans>What do you want to do?</Trans>
      </h3>

      <div
        className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', {
          'lg:grid-cols-3': PARAPHE_FEATURES.templates,
        })}
      >
        <UploadChoice
          mode="self"
          folderId={folderId}
          icon={PenLineIcon}
          title={<Trans>Just me</Trans>}
          hint={<Trans>Sign a file yourself and download it</Trans>}
          testId="start-choice-self"
        />

        <UploadChoice
          mode="send"
          folderId={folderId}
          icon={SendIcon}
          title={<Trans>Send for signature</Trans>}
          hint={<Trans>Add people and send it to sign</Trans>}
          testId="start-choice-send"
        />

        {PARAPHE_FEATURES.templates && (
          <Link to={formatTemplatesPath(team.url)} className={choiceClassName} data-testid="start-choice-template">
            <ChoiceBody
              icon={LayoutTemplateIcon}
              title={<Trans>Use a template</Trans>}
              hint={<Trans>Start from a document you saved before</Trans>}
            />
          </Link>
        )}
      </div>
    </section>
  );
};
