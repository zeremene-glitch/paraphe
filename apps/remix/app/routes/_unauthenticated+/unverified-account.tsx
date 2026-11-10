import { Trans } from '@lingui/react/macro';
import { Mails } from 'lucide-react';

import { SendConfirmationEmailForm } from '~/components/forms/send-confirmation-email';

export default function UnverifiedAccount() {
  return (
    <div className="w-screen max-w-lg px-4">
      <div className="flex items-start">
        <div className="mt-1 mr-4 hidden md:block">
          <Mails className="h-10 w-10 text-primary" strokeWidth={2} />
        </div>
        <div className="">
          <h2 className="font-bold text-2xl md:text-4xl">
            <Trans>Check your inbox</Trans>
          </h2>

          <p className="mt-4 text-muted-foreground">
            <Trans>
              We sent you a confirmation link. Click it to activate your account, then sign in. It can take a minute to
              arrive, and may land in spam.
            </Trans>
          </p>

          <details className="group mt-8">
            <summary className="cursor-pointer text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline">
              <Trans>Didn't get the email? Send it again</Trans>
            </summary>

            <SendConfirmationEmailForm />
          </details>
        </div>
      </div>
    </div>
  );
}
