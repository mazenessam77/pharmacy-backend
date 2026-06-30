/**
 * Central i18n configuration — the single source of truth for the supported
 * languages, namespaces and defaults. Adding a new language is a one-line change
 * here plus a matching folder under `locales/<lang>/`.
 */

export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Persisted key — kept in localStorage AND a cookie so SSR/edge can read it. */
export const LOCALE_STORAGE_KEY = 'pharmalink.lang';

/** Text direction per locale. Drives `<html dir>` and logical layout flipping. */
export const LOCALE_DIRECTION: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
};

/** Human-facing metadata for the language switcher / selection screen. */
export const LOCALE_META: Record<
  Locale,
  { label: string; englishLabel: string; flag: string; dir: 'ltr' | 'rtl' }
> = {
  en: { label: 'English', englishLabel: 'English', flag: '🇺🇸', dir: 'ltr' },
  ar: { label: 'العربية', englishLabel: 'Arabic', flag: '🇸🇦', dir: 'rtl' },
};

/**
 * Translation namespaces, organised by feature/module so files stay small and
 * ownership is clear. Keep this list in sync with `locales/<lang>/<ns>.json`.
 */
export const NAMESPACES = [
  'common', // shared atoms: buttons, generic labels, validation, toasts, states
  'nav', // navbar / sidebar / language switcher
  'footer',
  'landing',
  'auth',
  'dashboard',
  'profile',
  'pharmacy',
  'medicines', // product / catalog / search / filters / categories
  'orders', // cart / checkout / orders
  'notifications',
  'sideEffects',
  'errors',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export const DEFAULT_NAMESPACE: Namespace = 'common';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return LOCALE_DIRECTION[locale] ?? 'ltr';
}
