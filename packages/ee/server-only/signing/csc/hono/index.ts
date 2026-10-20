// SPDX-License-Identifier: AGPL-3.0-only — Paraphe replacement stub (original commercial code removed).
import { Hono } from 'hono';

/** Empty router: CSC OAuth routes are not available, so every /api/csc path is a 404. */
export const csc = new Hono();

export type CscAppType = typeof csc;
