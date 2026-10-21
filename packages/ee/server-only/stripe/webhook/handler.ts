// SPDX-License-Identifier: AGPL-3.0-only — Scriptia replacement stub (original commercial code removed).
export const stripeWebhookHandler = async (_req: Request): Promise<Response> => {
  return Response.json({ success: false, message: 'Stripe webhooks are not available in Scriptia' }, { status: 404 });
};
