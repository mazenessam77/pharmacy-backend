'use client';

/**
 * Client-side i18next instance. We use a client provider (not locale-prefixed
 * routing) on purpose: the requirement is to switch language *in place* —
 * persisted to localStorage/cookie, no URL change, no full reload, current
 * route + form state preserved. `LanguageDetector` reads the saved preference
 * (and falls back to the browser language) so returning users land in their
 * language automatically.
 */

import i18next, { type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { resources } from './resources';
import {
  DEFAULT_LOCALE,
  DEFAULT_NAMESPACE,
  LOCALES,
  LOCALE_STORAGE_KEY,
} from './settings';

let initialised = false;

export function getI18n(): I18nInstance {
  if (initialised) return i18next;

  i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: LOCALES as unknown as string[],
      // Only the language code, never region (e.g. `ar-EG` -> `ar`).
      load: 'languageOnly',
      defaultNS: DEFAULT_NAMESPACE,
      detection: {
        order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
        lookupLocalStorage: LOCALE_STORAGE_KEY,
        lookupCookie: LOCALE_STORAGE_KEY,
        caches: ['localStorage', 'cookie'],
      },
      interpolation: {
        // React already escapes; double-escaping breaks Arabic punctuation.
        escapeValue: false,
      },
      returnNull: false,
      react: {
        // No Suspense — we gate first paint ourselves to avoid any flicker.
        useSuspense: false,
      },
    });

  initialised = true;
  return i18next;
}

export default i18next;
