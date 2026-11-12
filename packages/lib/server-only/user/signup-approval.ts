import { mailer } from '@documenso/email/mailer';
import { prisma } from '@documenso/prisma';

import { NEXT_PUBLIC_WEBAPP_URL } from '../../constants/app';
import { DOCUMENSO_INTERNAL_EMAIL } from '../../constants/email';
import { PARAPHE_FEATURES } from '../../constants/paraphe';
import { env } from '../../utils/env';
import { createSampleDocument } from './create-sample-document';

/**
 * Scriptia: when NEXT_PRIVATE_SIGNUP_REQUIRES_APPROVAL=true, every new self-service
 * account starts disabled. The operator approves it with "Enable" in the admin panel.
 * Read at runtime, so it can be switched with an env change and a restart.
 */
export const signupRequiresApproval = () => env('NEXT_PRIVATE_SIGNUP_REQUIRES_APPROVAL') === 'true';

/**
 * Runs after an admin enables a user that was disabled.
 *
 * Accounts approved for the first time get the sample document they could not get
 * while pending (a disabled user cannot own new documents). Every re-enabled user
 * gets a short "your account is active" email. Never throws.
 */
export const onUserApproved = async ({ userId }: { userId: number }) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { id: true, name: true, email: true, _count: { select: { envelopes: true } } },
    });

    if (!user) {
      return;
    }

    if (PARAPHE_FEATURES.sampleDocument && user._count.envelopes === 0) {
      await createSampleDocument({ userId: user.id }).catch((err) => {
        console.error('[Scriptia] Sample document was not created on approval', err);
      });
    }

    const signInUrl = `${NEXT_PUBLIC_WEBAPP_URL()}/signin`;
    const greeting = user.name ? `Hi ${user.name},` : 'Hi,';

    const text = [
      greeting,
      '',
      'Your Scriptia account is approved. You can sign in and send your first document now:',
      signInUrl,
      '',
      'Questions? Reply to support@scriptia.eu.',
      '',
      'Scriptia · E-signatures, made in Europe',
    ].join('\n');

    const escapeHtml = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111;max-width:520px">
<p>${escapeHtml(greeting)}</p>
<p>Your Scriptia account is approved. You can sign in and send your first document now.</p>
<p><a href="${signInUrl}" style="display:inline-block;background:#2457ff;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold">Sign in to Scriptia</a></p>
<p style="color:#555">Questions? Write to <a href="mailto:support@scriptia.eu">support@scriptia.eu</a>.</p>
<p style="color:#888;font-size:13px">Scriptia · E-signatures, made in Europe</p></div>`;

    await mailer.sendMail({
      to: user.email,
      from: DOCUMENSO_INTERNAL_EMAIL,
      subject: 'Your Scriptia account is approved',
      text,
      html,
    });
  } catch (err) {
    console.error('[onUserApproved]', err);
  }
};
