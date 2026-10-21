/**
 * Scriptia MVP feature switches.
 *
 * Scriptia ships a smaller product than upstream Documenso. Features that are out of
 * scope for the MVP are hidden from navigation and menus here, in one place, so they
 * can be switched back on later and upstream merges stay simple.
 *
 * The routes still exist; these switches only control what the UI offers.
 */
export const PARAPHE_FEATURES = {
  templates: false,
  organisations: false,
  teams: false,
  apiTokens: false,
  webhooks: false,
  publicProfile: false,
  languageSwitcher: false,
  supportPage: false,
} as const;
