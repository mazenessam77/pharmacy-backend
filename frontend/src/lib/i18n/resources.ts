/**
 * Static resource registry. Translations are bundled (not async-loaded) so the
 * correct language is available on first paint — no loading flash, no waterfall.
 *
 * To add a namespace: drop `locales/en/<ns>.json` + `locales/ar/<ns>.json`,
 * import both here, and add them to the maps below. `en` is the source of truth
 * for key shape and powers the type-safe `t()` keys (see `i18next.d.ts`).
 */

import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enFooter from './locales/en/footer.json';
import enLanding from './locales/en/landing.json';
import enAuth from './locales/en/auth.json';
import enErrors from './locales/en/errors.json';

import arCommon from './locales/ar/common.json';
import arNav from './locales/ar/nav.json';
import arFooter from './locales/ar/footer.json';
import arLanding from './locales/ar/landing.json';
import arAuth from './locales/ar/auth.json';
import arErrors from './locales/ar/errors.json';

export const resources = {
  en: {
    common: enCommon,
    nav: enNav,
    footer: enFooter,
    landing: enLanding,
    auth: enAuth,
    errors: enErrors,
  },
  ar: {
    common: arCommon,
    nav: arNav,
    footer: arFooter,
    landing: arLanding,
    auth: arAuth,
    errors: arErrors,
  },
} as const;

export type AppResources = (typeof resources)['en'];
