import { mailer } from '@documenso/email/mailer';
import { prisma } from '@documenso/prisma';

import { NEXT_PUBLIC_WEBAPP_URL } from '../../constants/app';
import { DOCUMENSO_INTERNAL_EMAIL } from '../../constants/email';
import { env } from '../../utils/env';

export type NotifyAdminOfSignupOptions = {
  userId: number;
  name: string;
  email: string;
};

/**
 * Scriptia: tell the operator about every new self-service account.
 * Sent to NEXT_PRIVATE_SIGNUP_NOTIFY_EMAIL; does nothing when it is unset.
 * Never throws, so a mail problem can't break a sign-up.
 */
export const notifyAdminOfSignup = async ({ userId, name, email }: NotifyAdminOfSignupOptions) => {
  const to = env('NEXT_PRIVATE_SIGNUP_NOTIFY_EMAIL');

  if (!to) {
    return;
  }

  try {
    const total = await prisma.user.count();
    const adminUrl = `${NEXT_PUBLIC_WEBAPP_URL()}/admin/users/${userId}`;
    const when = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Lisbon' });

    const text = [
      'A new account was created on Scriptia.',
      '',
      `Name:  ${name || '(no name)'}`,
      `Email: ${email}`,
      `When:  ${when} (Lisbon)`,
      `Total accounts now: ${total}`,
      '',
      `Open in admin: ${adminUrl}`,
    ].join('\n');

    const escapeHtml = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">
<p>A new account was created on Scriptia.</p>
<table style="border-collapse:collapse">
<tr><td style="padding:2px 16px 2px 0;color:#666">Name</td><td>${escapeHtml(name || '(no name)')}</td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#666">Email</td><td>${escapeHtml(email)}</td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#666">When</td><td>${escapeHtml(when)} (Lisbon)</td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#666">Total accounts</td><td>${total}</td></tr>
</table>
<p><a href="${adminUrl}">Open in admin</a></p></div>`;

    await mailer.sendMail({
      to,
      from: DOCUMENSO_INTERNAL_EMAIL,
      subject: `New Scriptia sign-up: ${email}`,
      text,
      html,
    });
  } catch (err) {
    console.error('[notifyAdminOfSignup]', err);
  }
};
